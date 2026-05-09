"use client";

import { createClient } from "@/lib/supabase/client";

export async function signInWithGoogle() {
  const supabase = createClient();
  if (!supabase) {
    alert("Auth no configurada. Contacta al administrador.");
    return;
  }
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const next = "/album";
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
}
