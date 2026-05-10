"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveHomeLocation(lng: number, lat: number) {
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("profiles")
    .update({ home_location: `POINT(${lng} ${lat})` })
    .eq("id", user.id);

  if (error) {
    console.error("[cromio] saveHomeLocation failed:", error);
  }
}

const ALIAS_RE = /^[a-z0-9_]{3,24}$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

type ProfileUpdate = {
  alias?: string;
  display_name?: string | null;
  color?: string;
  avatar_url?: string | null;
};

export async function updateProfile(input: ProfileUpdate) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };

  const payload: Record<string, unknown> = {};

  if (input.alias !== undefined) {
    const alias = input.alias.trim().toLowerCase();
    if (!ALIAS_RE.test(alias)) return { error: "invalid_alias" };
    payload.alias = alias;
  }
  if (input.display_name !== undefined) {
    payload.display_name = input.display_name?.trim().slice(0, 60) || null;
  }
  if (input.color !== undefined) {
    if (!COLOR_RE.test(input.color)) return { error: "invalid_color" };
    payload.color = input.color;
  }
  if (input.avatar_url !== undefined) {
    payload.avatar_url = input.avatar_url || null;
  }

  if (Object.keys(payload).length === 0) return { ok: true };

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") return { error: "alias_taken" };
    return { error: error.message };
  }
  revalidatePath("/perfil");
  return { ok: true };
}
