"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics/track";
import { isStandalonePwa } from "@/lib/analytics/useTrack";

const SESSION_KEY = "cromio:lastSessionAt";
const SESSION_WINDOW_MS = 30 * 60 * 1000;

function maybeFireSessionStart() {
  if (typeof window === "undefined") return;
  try {
    const last = Number(window.localStorage.getItem(SESSION_KEY) ?? 0);
    const now = Date.now();
    if (now - last > SESSION_WINDOW_MS) {
      window.localStorage.setItem(SESSION_KEY, String(now));
      void trackEvent({
        kind: "session_start",
        metadata: { is_pwa: isStandalonePwa() },
      });
    }
  } catch {
    // localStorage may be unavailable (private mode) — ignore
  }
}

export function PageViewTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    maybeFireSessionStart();
  }, []);

  useEffect(() => {
    if (!pathname || pathname === lastPathRef.current) return;
    lastPathRef.current = pathname;

    const handle = window.setTimeout(() => {
      void trackEvent({
        kind: "page_view",
        path: pathname,
        metadata: { is_pwa: isStandalonePwa() },
      });
    }, 500);

    return () => window.clearTimeout(handle);
  }, [pathname]);

  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      void trackEvent({
        kind: "client_error",
        path: typeof window !== "undefined" ? window.location.pathname : undefined,
        metadata: {
          message: String(e.message ?? ""),
          src: e.filename ?? null,
          line: e.lineno ?? null,
          col: e.colno ?? null,
        },
      });
    };
    window.addEventListener("error", onError);
    return () => window.removeEventListener("error", onError);
  }, []);

  return null;
}
