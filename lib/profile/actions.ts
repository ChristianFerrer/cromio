"use server";

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
