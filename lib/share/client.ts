"use client";

import { pushAppToast } from "@/lib/notifications/toast";

type ShareInput = {
  title: string;
  text?: string;
  /** Absolute or relative path. Resolved against window.location.origin. */
  path: string;
};

/**
 * Tries the Web Share API first, falls back to writing the absolute URL to
 * the clipboard with a toast. Returns true if something useful happened.
 */
export async function shareOrCopy({ title, text, path }: ShareInput) {
  if (typeof window === "undefined") return false;
  const url = new URL(path, window.location.origin).toString();

  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (err) {
      // AbortError when the user dismisses the share sheet — not really an
      // error, just no-op.
      if ((err as { name?: string })?.name === "AbortError") return false;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    pushAppToast({
      kind: "success",
      title: "Enlace copiado",
      body: "Ya puedes pegarlo donde quieras.",
    });
    return true;
  } catch {
    pushAppToast({
      kind: "error",
      title: "No se pudo copiar",
      body: "Tu navegador bloqueó el portapapeles. Copia el enlace de la barra de direcciones.",
    });
    return false;
  }
}
