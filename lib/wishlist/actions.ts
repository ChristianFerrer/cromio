"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TOTAL_STICKERS } from "@/lib/data/stickers";

export async function toggleWishlist(stickerN: number) {
  if (!Number.isInteger(stickerN) || stickerN < 1 || stickerN > TOTAL_STICKERS) {
    return { error: "invalid_sticker" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };

  const { data: existing } = await supabase
    .from("user_wishlist")
    .select("sticker_n")
    .eq("user_id", user.id)
    .eq("sticker_n", stickerN)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("user_wishlist")
      .delete()
      .eq("user_id", user.id)
      .eq("sticker_n", stickerN);
    if (error) return { error: error.message };
    revalidatePath("/perfil/lista-deseos");
    return { ok: true, wanted: false };
  }

  const { error } = await supabase
    .from("user_wishlist")
    .insert({ user_id: user.id, sticker_n: stickerN });
  if (error && error.code !== "23505") return { error: error.message };
  revalidatePath("/perfil/lista-deseos");
  return { ok: true, wanted: true };
}
