"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { TrackPayload } from "./types";

function detectDevice(ua: string | null): "ios" | "android" | "desktop" | "other" {
  if (!ua) return "other";
  const u = ua.toLowerCase();
  if (/iphone|ipad|ipod/.test(u)) return "ios";
  if (/android/.test(u)) return "android";
  if (/windows|macintosh|linux|x11/.test(u)) return "desktop";
  return "other";
}

export async function trackEvent({
  kind,
  path,
  metadata,
}: TrackPayload): Promise<{ ok: boolean }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const h = await headers();
    const ua = h.get("user-agent");
    const country =
      h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? null;

    const meta = { ...(metadata ?? {}) } as Record<string, unknown>;
    const isPwa =
      typeof meta.is_pwa === "boolean" ? (meta.is_pwa as boolean) : null;
    if ("is_pwa" in meta) delete meta.is_pwa;

    await supabase.from("events").insert({
      user_id: user?.id ?? null,
      kind,
      path: path ?? null,
      country,
      device: detectDevice(ua),
      is_pwa: isPwa,
      metadata: meta,
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
