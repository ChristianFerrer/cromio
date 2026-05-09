import { createBrowserClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;
let warned = false;

export function createClient(): SupabaseClient | null {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (!warned && typeof window !== "undefined") {
      console.warn(
        "[cromio] Supabase env vars missing — running in anonymous mode.",
      );
      warned = true;
    }
    return null;
  }

  cached = createBrowserClient(url, key);
  return cached;
}
export type { CookieOptions };
