"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push/server";

export type TradeItem = { n: number; qty: number };
export type TradeItems = { from_gives: TradeItem[]; to_gives: TradeItem[] };

export type TradeResult = { ok: true; id?: string; done?: boolean } | { ok: false; error: string };

// Sender hits the Intercambiar button. The client passes the n's the user
// kept selected in the match view; we filter the pairwise match against
// them so a deselected cromo never travels to the recipient.
export async function requestTrade(
  toUserId: string,
  selectedYouGet: number[] = [],
  selectedTheyGet: number[] = [],
): Promise<TradeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };
  if (user.id === toUserId) return { ok: false, error: "self_target" };

  const [mineRes, theirsRes, profileRes] = await Promise.all([
    supabase.from("user_stickers").select("sticker_n, count").eq("user_id", user.id),
    supabase.from("user_stickers").select("sticker_n, count").eq("user_id", toUserId),
    supabase.from("profiles").select("alias, display_name").eq("id", user.id).maybeSingle(),
  ]);

  const myCol = new Map<number, number>();
  for (const r of mineRes.data ?? []) myCol.set(r.sticker_n, r.count);
  const theirCol = new Map<number, number>();
  for (const r of theirsRes.data ?? []) theirCol.set(r.sticker_n, r.count);

  const youGetWhitelist = new Set(selectedYouGet);
  const theyGetWhitelist = new Set(selectedTheyGet);
  const noFilter =
    selectedYouGet.length === 0 && selectedTheyGet.length === 0;

  const from_gives: TradeItem[] = [];
  const to_gives: TradeItem[] = [];
  for (const n of new Set<number>([...myCol.keys(), ...theirCol.keys()])) {
    const mine = myCol.get(n) ?? 0;
    const theirs = theirCol.get(n) ?? 0;
    // from_gives = sender gives -> matches "Entregas" column on the UI.
    if (mine >= 2 && theirs === 0 && (noFilter || theyGetWhitelist.has(n))) {
      from_gives.push({ n, qty: 1 });
    }
    // to_gives = receiver gives -> matches "Recibes" column on the UI.
    if (mine === 0 && theirs >= 2 && (noFilter || youGetWhitelist.has(n))) {
      to_gives.push({ n, qty: 1 });
    }
  }

  if (from_gives.length === 0 && to_gives.length === 0) {
    return { ok: false, error: "empty_trade" };
  }

  const { data, error } = await supabase.rpc("request_trade", {
    p_to_user_id: toUserId,
    p_items: { from_gives, to_gives },
  });
  if (error) {
    // Map the most common Postgres exception messages to stable codes.
    const code =
      error.code === "23505" || error.message.includes("one_active_per_pair")
        ? "already_pending"
        : error.message.replace(/^.*: /, "") || "rpc_error";
    return { ok: false, error: code };
  }

  // Best-effort push to the recipient.
  const senderName =
    profileRes.data?.display_name || profileRes.data?.alias || "Alguien";
  await sendPushToUser(toUserId, {
    title: "Nueva solicitud de intercambio",
    body: `${senderName} quiere intercambiar cromos contigo.`,
    url: `/match/${user.id}`,
    tag: `trade-${data ?? "new"}`,
  });

  revalidatePath("/match/[userId]", "page");
  return { ok: true, id: data ?? undefined };
}

export async function acceptTradeRequest(reqId: string): Promise<TradeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };
  const { error } = await supabase.rpc("accept_trade_request", { p_req_id: reqId });
  if (error) return { ok: false, error: error.message.replace(/^.*: /, "") };

  // Notify the original sender that the receiver agreed.
  const { data: row } = await supabase
    .from("trade_requests")
    .select("from_user_id, to_user_id")
    .eq("id", reqId)
    .maybeSingle();
  if (row?.from_user_id && row.to_user_id) {
    const { data: receiver } = await supabase
      .from("profiles")
      .select("alias, display_name")
      .eq("id", row.to_user_id)
      .maybeSingle();
    const name = receiver?.display_name || receiver?.alias || "Tu contacto";
    await sendPushToUser(row.from_user_id, {
      title: "Intercambio aceptado",
      body: `${name} aceptó tu solicitud. Quedad para hacerlo realidad.`,
      url: `/match/${row.to_user_id}`,
      tag: `trade-${reqId}`,
    });
  }
  revalidatePath("/match/[userId]", "page");
  return { ok: true };
}

export async function rejectTradeRequest(reqId: string): Promise<TradeResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_trade_request", { p_req_id: reqId });
  if (error) return { ok: false, error: error.message.replace(/^.*: /, "") };
  revalidatePath("/match/[userId]", "page");
  return { ok: true };
}

export async function cancelTradeRequest(reqId: string): Promise<TradeResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_trade_request", { p_req_id: reqId });
  if (error) return { ok: false, error: error.message.replace(/^.*: /, "") };
  revalidatePath("/match/[userId]", "page");
  return { ok: true };
}

export async function markTradeDone(reqId: string): Promise<TradeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  const { data: result, error } = await supabase.rpc("mark_trade_done", { p_req_id: reqId });
  if (error) return { ok: false, error: error.message.replace(/^.*: /, "") };

  if (result === "stale") {
    return { ok: false, error: "stale" };
  }

  // Tell the other party the trade settled.
  const { data: row } = await supabase
    .from("trade_requests")
    .select("from_user_id, to_user_id")
    .eq("id", reqId)
    .maybeSingle();
  if (row) {
    const otherId = row.from_user_id === user.id ? row.to_user_id : row.from_user_id;
    await sendPushToUser(otherId, {
      title: "Intercambio completado",
      body: "Tu álbum se actualizó automáticamente.",
      url: `/album`,
      tag: `trade-done-${reqId}`,
    });
  }

  revalidatePath("/match/[userId]", "page");
  revalidatePath("/album", "page");
  return { ok: true, done: true };
}
