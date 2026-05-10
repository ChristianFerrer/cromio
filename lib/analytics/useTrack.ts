"use client";

import { useCallback, useRef } from "react";
import { trackEvent } from "./track";
import type { TrackPayload } from "./types";

const DEBOUNCE_MS = 500;

export function useTrack() {
  const queueRef = useRef<TrackPayload | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback((payload: TrackPayload) => {
    queueRef.current = payload;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const p = queueRef.current;
      queueRef.current = null;
      timerRef.current = null;
      if (p) void trackEvent(p);
    }, DEBOUNCE_MS);
  }, []);
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const mm = window.matchMedia?.("(display-mode: standalone)").matches;
  const ios = "standalone" in window.navigator &&
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return Boolean(mm || ios);
}
