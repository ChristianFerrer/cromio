"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const REASONS = ["spam", "abuse", "no_show", "fake_profile", "inappropriate", "other"] as const;
type Reason = (typeof REASONS)[number];

export async function blockUser(targetId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };
  if (user.id === targetId) return { error: "cannot_block_self" };

  const { error } = await supabase
    .from("user_blocks")
    .insert({ blocker_id: user.id, blocked_id: targetId });
  if (error && error.code !== "23505") return { error: error.message };

  // Drop any favorite relation in either direction so the UI doesn't keep
  // surfacing the blocked user.
  await supabase
    .from("user_favorites")
    .delete()
    .or(
      `and(user_id.eq.${user.id},favorite_user_id.eq.${targetId}),and(user_id.eq.${targetId},favorite_user_id.eq.${user.id})`,
    );

  revalidatePath("/mapa");
  revalidatePath("/favoritos");
  revalidatePath(`/match/${targetId}`);
  return { ok: true };
}

export async function unblockUser(targetId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };

  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", targetId);
  if (error) return { error: error.message };

  revalidatePath("/mapa");
  revalidatePath("/favoritos");
  return { ok: true };
}

export async function reportUser(
  targetId: string,
  reason: Reason,
  note?: string,
  alsoBlock = true,
) {
  if (!REASONS.includes(reason)) return { error: "invalid_reason" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };
  if (user.id === targetId) return { error: "cannot_report_self" };

  const { error } = await supabase.from("user_reports").insert({
    reporter_id: user.id,
    reported_id: targetId,
    reason,
    note: note?.trim().slice(0, 500) || null,
  });
  if (error) return { error: error.message };

  if (alsoBlock) {
    await blockUser(targetId);
  }
  return { ok: true };
}

export async function isBlocked(targetId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("user_blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id)
    .eq("blocked_id", targetId)
    .maybeSingle();
  return !!data;
}
