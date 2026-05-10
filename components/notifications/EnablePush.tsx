"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import {
  removePushSubscription,
  savePushSubscription,
} from "@/lib/push/actions";
import { useUser } from "@/hooks/useUser";
import { pushAppToast } from "@/lib/notifications/toast";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const DISMISS_KEY = "cromio:push-dismissed";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer | null) {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function subscribeAndSave(userAgent: string) {
  if (!VAPID_PUBLIC_KEY) throw new Error("missing_vapid_public_key");
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));
  await savePushSubscription({
    endpoint: sub.endpoint,
    p256dh: arrayBufferToBase64Url(sub.getKey("p256dh")),
    auth: arrayBufferToBase64Url(sub.getKey("auth")),
    userAgent,
  });
  return sub;
}

type StandaloneNavigator = Navigator & { standalone?: boolean };

function detectIosNotInstalled() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  if (!isIos) return false;
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as StandaloneNavigator).standalone === true;
  return !standalone;
}

export function EnablePush() {
  const { user, loading } = useUser();
  const [supported, setSupported] = useState(false);
  const [iosInstallHint, setIosInstallHint] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [dismissed, setDismissed] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window &&
      !!VAPID_PUBLIC_KEY;
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
    setIosInstallHint(!ok && detectIosNotInstalled());
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  // Auto-register the SW so push delivery works once permission is granted.
  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, [supported]);

  // If permission is already granted, make sure the DB has the subscription.
  useEffect(() => {
    if (!supported || !user || permission !== "granted") return;
    let cancelled = false;
    (async () => {
      try {
        await subscribeAndSave(navigator.userAgent);
      } catch (err) {
        if (cancelled) return;
        console.error("[cromio] push (re)subscribe failed:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supported, user, permission]);

  const enable = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        await subscribeAndSave(navigator.userAgent);
        pushAppToast({ kind: "success", body: "Notificaciones activadas" });
      } else if (result === "denied") {
        pushAppToast({
          kind: "info",
          title: "Notificaciones bloqueadas",
          body: "Ajustes del navegador → Permisos → Notificaciones para reactivarlas.",
        });
      }
    } catch (err) {
      console.error("[cromio] enable push failed:", err);
      pushAppToast({
        kind: "error",
        title: "No se pudieron activar",
        body: "Reintenta o revisa los permisos del navegador.",
      });
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(DISMISS_KEY, "1");
    }
  }, []);

  if (loading || !user) return null;
  if (dismissed) return null;

  if (iosInstallHint) {
    return (
      <div className="pointer-events-auto fixed inset-x-3 bottom-24 z-[60] mx-auto flex max-w-[406px] items-start gap-3 rounded-md border border-black/5 bg-white/95 p-3 shadow-sh3 backdrop-blur-xl">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-green-500 text-white">
          <Bell size={16} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-text">Recibe notificaciones en iPhone</p>
          <p className="text-xs text-text-2">
            Toca <span className="font-semibold">Compartir</span> en Safari y elige{" "}
            <span className="font-semibold">Añadir a pantalla de inicio</span>. Abre Cromio
            desde el icono para activar mensajes y matches.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="grid h-7 w-7 shrink-0 place-items-center rounded text-text-2"
          aria-label="Cerrar"
        >
          <X size={14} strokeWidth={2.2} />
        </button>
      </div>
    );
  }

  if (!supported) return null;
  if (permission === "granted") return null;
  if (permission === "denied") return null;

  return (
    <div className="pointer-events-auto fixed inset-x-3 bottom-24 z-[60] mx-auto flex max-w-[406px] items-center gap-3 rounded-md border border-black/5 bg-white/95 p-3 shadow-sh3 backdrop-blur-xl">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-green-500 text-white">
        <Bell size={16} strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-text">Activa las notificaciones</p>
        <p className="text-xs text-text-2">
          Mensajes y nuevos matches incluso con la app cerrada.
        </p>
      </div>
      <button
        onClick={enable}
        disabled={busy}
        className="rounded-md bg-green-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        Activar
      </button>
      <button
        onClick={dismiss}
        className="grid h-7 w-7 shrink-0 place-items-center rounded text-text-2"
        aria-label="Cerrar"
      >
        <X size={14} strokeWidth={2.2} />
      </button>
    </div>
  );
}

export async function disablePushOnThisDevice() {
  if (typeof window === "undefined") return;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  try {
    await sub.unsubscribe();
  } catch (err) {
    console.error("[cromio] unsubscribe failed:", err);
  }
  await removePushSubscription(endpoint);
}
