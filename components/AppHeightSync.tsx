"use client";

import { useEffect } from "react";

// Definitive fix for the "BottomNav looks lifted" iOS bug.
// `100dvh` in iOS PWA standalone has been observed to under-report by a
// safe-area-inset-bottom on certain webkit builds — leaving a strip of
// blank canvas below any flex-column container that uses it. We
// sidestep CSS interpretation entirely by mirroring window.innerHeight
// into a CSS variable on every resize/visualViewport change.
//
// The app layout reads --app-height as its primary height; if JS hasn't
// run yet (SSR first paint) it falls back to 100dvh.
export function AppHeightSync() {
  useEffect(() => {
    const apply = () => {
      document.documentElement.style.setProperty(
        "--app-height",
        `${window.innerHeight}px`,
      );
    };
    apply();
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
      vv?.removeEventListener("resize", apply);
    };
  }, []);
  return null;
}
