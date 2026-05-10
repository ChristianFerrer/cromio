"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Volume2, VolumeX } from "lucide-react";
import { disablePushOnThisDevice } from "@/components/notifications/EnablePush";
import { savePushSubscription } from "@/lib/push/actions";
import { pushAppToast } from "@/lib/notifications/toast";
import {
  isSoundEnabled,
  setSoundEnabled,
  playMessageSound,
} from "@/lib/notifications/sound";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function abToB64Url(buf: ArrayBuffer | null) {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function ProfileSettings() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sound, setSound] = useState(false);

  useEffect(() => {
    setSound(isSoundEnabled());
  }, []);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window &&
      !!VAPID_PUBLIC_KEY;
    setSupported(ok);
    if (!ok) return;
    (async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      setEnabled(Notification.permission === "granted" && !!sub);
    })();
  }, []);

  if (!supported) return null;

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (enabled) {
        await disablePushOnThisDevice();
        setEnabled(false);
        pushAppToast({ kind: "info", body: "Notificaciones desactivadas" });
        return;
      }
      if (!VAPID_PUBLIC_KEY) {
        pushAppToast({
          kind: "error",
          title: "Falta configurar VAPID",
          body: "Pídele al admin que configure las claves de notificaciones.",
        });
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm === "denied") {
        pushAppToast({
          kind: "info",
          title: "Notificaciones bloqueadas",
          body: "Ajustes del navegador → Permisos → Notificaciones.",
        });
        return;
      }
      if (perm !== "granted") return;
      await navigator.serviceWorker.register("/sw.js");
      const ready = await navigator.serviceWorker.ready;
      const existing = await ready.pushManager.getSubscription();
      const sub =
        existing ??
        (await ready.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));
      await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: abToB64Url(sub.getKey("p256dh")),
        auth: abToB64Url(sub.getKey("auth")),
        userAgent: navigator.userAgent,
      });
      setEnabled(true);
      pushAppToast({ kind: "success", body: "Notificaciones activadas" });
    } catch (err) {
      console.error("[cromio] push toggle failed:", err);
      pushAppToast({
        kind: "error",
        title: "No se pudieron activar",
        body: "Reintenta o revisa los permisos del navegador.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-5 divide-y divide-line rounded-md border border-line bg-white">
      <button
        onClick={toggle}
        disabled={busy}
        className="flex w-full items-center gap-3 p-4 disabled:opacity-50"
        aria-pressed={enabled}
      >
        <div
          className={`grid h-9 w-9 place-items-center rounded-full ${
            enabled ? "bg-green-100 text-green-700" : "bg-paper text-text-2"
          }`}
        >
          {enabled ? <Bell size={16} strokeWidth={2.2} /> : <BellOff size={16} strokeWidth={2} />}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold">Notificaciones push</p>
          <p className="text-xs text-text-2">
            {enabled
              ? "Activas en este dispositivo"
              : "Recibe avisos de mensajes y nuevos matches"}
          </p>
        </div>
        <SwitchKnob on={enabled} />
      </button>

      <button
        onClick={() => {
          const next = !sound;
          setSound(next);
          setSoundEnabled(next);
          if (next) void playMessageSound();
        }}
        className="flex w-full items-center gap-3 p-4"
        aria-pressed={sound}
      >
        <div
          className={`grid h-9 w-9 place-items-center rounded-full ${
            sound ? "bg-green-100 text-green-700" : "bg-paper text-text-2"
          }`}
        >
          {sound ? <Volume2 size={16} strokeWidth={2.2} /> : <VolumeX size={16} strokeWidth={2} />}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold">Sonido al recibir mensajes</p>
          <p className="text-xs text-text-2">
            {sound
              ? "Un tono corto cuando llega un mensaje nuevo."
              : "Activa el tono in-app al recibir un mensaje."}
          </p>
        </div>
        <SwitchKnob on={sound} />
      </button>
    </section>
  );
}

function SwitchKnob({ on }: { on: boolean }) {
  return (
    <span
      className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
        on ? "bg-green-500" : "bg-line"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sh1 transition-transform ${
          on ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </span>
  );
}
