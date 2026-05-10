"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js as soon as the page is idle so the offline shell and tile
 * cache start working from the first visit. Independent from push, which has
 * its own permission-gated registration in EnablePush — this just ensures the
 * SW is installed even if the user never enables notifications.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "development") return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => {
          console.warn("[cromio] SW register failed:", err);
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);
  return null;
}
