"use client";

import { useEffect, useState } from "react";
import { Share, Plus, X, Smartphone } from "lucide-react";

const DISMISS_KEY = "cromio:install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPwaBanner() {
  const [variant, setVariant] = useState<"none" | "ios" | "prompt">("none");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");

    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS-specific
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      setVariant("none");
      return;
    }

    const ua = navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/crios|fxios|edgios/.test(ua);

    if (isIos && isSafari) {
      setVariant("ios");
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setVariant("prompt");
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (variant === "none" || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  const triggerNativeInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") setDismissed(true);
    setInstallEvent(null);
    setVariant("none");
  };

  if (variant === "prompt") {
    return (
      <div className="pointer-events-auto fixed inset-x-3 bottom-24 z-[55] mx-auto flex max-w-[406px] items-center gap-3 rounded-md border border-black/5 bg-white/95 p-3 shadow-sh3 backdrop-blur-xl">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-green-500 text-white">
          <Smartphone size={16} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-text">Instala Cromio</p>
          <p className="text-xs text-text-2">
            Pantalla completa y notificaciones del SO.
          </p>
        </div>
        <button
          onClick={triggerNativeInstall}
          className="rounded-md bg-green-500 px-3 py-1.5 text-xs font-semibold text-white"
        >
          Instalar
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

  // iOS
  return (
    <div className="pointer-events-auto fixed inset-x-3 bottom-24 z-[55] mx-auto max-w-[406px] rounded-md border border-black/5 bg-white/95 p-3 shadow-sh3 backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-green-500 text-white">
          <Smartphone size={16} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-text">Instala Cromio en tu iPhone</p>
          <p className="mt-1 text-xs leading-snug text-text-2">
            Toca <Share size={12} className="-mt-0.5 inline text-sky-500" strokeWidth={2.4} /> en
            la barra de Safari y luego{" "}
            <span className="inline-flex items-center gap-0.5 font-semibold text-text">
              <Plus size={12} strokeWidth={2.4} /> Añadir a pantalla de inicio
            </span>
            . Las notificaciones del sistema necesitan instalación.
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
    </div>
  );
}
