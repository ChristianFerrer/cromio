import { createClient } from "@/lib/supabase/server";

export type TradeStatus =
  | "pending"
  | "accepted"
  | "done"
  | "rejected"
  | "cancelled"
  | "stale";

export type TradeItem = { n: number; qty: number };
export type TradeItems = { from_gives: TradeItem[]; to_gives: TradeItem[] };

export type TradeRequestRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: TradeStatus;
  items: TradeItems;
  created_at: string;
  accepted_at: string | null;
  done_at: string | null;
  resolved_at: string | null;
};

// Active = pending OR accepted (i.e. not settled, not cancelled, not rejected)
export async function loadActiveTradeBetween(
  meId: string,
  otherId: string,
): Promise<TradeRequestRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trade_requests")
    .select(
      "id, from_user_id, to_user_id, status, items, created_at, accepted_at, done_at, resolved_at",
    )
    .in("status", ["pending", "accepted"])
    .or(
      `and(from_user_id.eq.${meId},to_user_id.eq.${otherId}),and(from_user_id.eq.${otherId},to_user_id.eq.${meId})`,
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as TradeRequestRow | null) ?? null;
}

export async function loadPendingIncomingCount(meId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("trade_requests")
    .select("id", { count: "exact", head: true })
    .eq("to_user_id", meId)
    .eq("status", "pending");
  return count ?? 0;
}

export async function loadCompletedTradesForCurrentUser(): Promise<
  Array<{
    id: string;
    other: { id: string; alias: string; display_name: string | null; color: string | null };
    items: TradeItems;
    done_at: string;
    direction: "outgoing" | "incoming";
  }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // FK targets auth.users, not profiles, so we can't embed the join. Two-step.
  const { data: trades } = await supabase
    .from("trade_requests")
    .select("id, from_user_id, to_user_id, items, done_at")
    .eq("status", "done")
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
    .order("done_at", { ascending: false });
  if (!trades || trades.length === 0) return [];

  const otherIds = trades.map((t) =>
    t.from_user_id === user.id ? t.to_user_id : t.from_user_id,
  );
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, alias, display_name, color")
    .in("id", otherIds);
  const byId = new Map<string, { id: string; alias: string; display_name: string | null; color: string | null }>();
  for (const p of profiles ?? []) byId.set(p.id, p);

  type Trade = {
    id: string;
    from_user_id: string;
    to_user_id: string;
    items: TradeItems;
    done_at: string;
  };

  return (trades as Trade[]).flatMap((t) => {
    const isOutgoing = t.from_user_id === user.id;
    const otherId = isOutgoing ? t.to_user_id : t.from_user_id;
    const other = byId.get(otherId);
    if (!other) return [];
    return [
      {
        id: t.id,
        other,
        items: t.items,
        done_at: t.done_at,
        direction: isOutgoing ? ("outgoing" as const) : ("incoming" as const),
      },
    ];
  });
}
