"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function adjustStickerCount(stickerN: number, delta: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not_authenticated" };

  const { data: existing } = await supabase
    .from("user_stickers")
    .select("count")
    .eq("user_id", user.id)
    .eq("sticker_n", stickerN)
    .maybeSingle();

  const next = Math.max(0, (existing?.count ?? 0) + delta);

  const { error } = await supabase
    .from("user_stickers")
    .upsert(
      { user_id: user.id, sticker_n: stickerN, count: next },
      { onConflict: "user_id,sticker_n" },
    );

  if (error) return { error: error.message };
  revalidatePath("/album");
  return { count: next };
}

export async function loadUserCollection() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data } = await supabase
    .from("user_stickers")
    .select("sticker_n, count")
    .eq("user_id", user.id);

  const map: Record<number, number> = {};
  for (const row of data ?? []) {
    map[row.sticker_n] = row.count;
  }
  return map;
}
