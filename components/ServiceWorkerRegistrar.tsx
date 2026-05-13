"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js, then ACTIVELY checks for updates on every launch
 * and on tab visibility change. When a new SW takes over (via the
 * controllerchange event), we reload the page once so the user always
 * sees the latest bundle.
 *
 * Without this, iOS PWA standalone keeps running the SW that was
 * cached at install time forever — bumping VERSION in /public/sw.js
 * has no effect until the user reinstalls the PWA. This was breaking
 * every layout/nav fix we pushed: the new SW was deployed but the
 * client never noticed.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "development") return;

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        // Immediate update poll. If a new sw.js is on the server,
        // installing → waiting → (skipWaiting in install) → active →
        // controllerchange → reload.
        reg.update().catch(() => {});
      } catch (err) {
        console.warn("[cromio] SW register failed:", err);
      }
    };

    // Also poll for updates every time the user returns to the tab.
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => reg?.update())
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  return null;
}
