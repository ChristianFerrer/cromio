"use client";

import { useState } from "react";
import { Copy, Share2 } from "lucide-react";
import { pushAppToast } from "@/lib/notifications/toast";

export function ShareActions({
  url,
  shareText,
  whatsappCopy,
  copyCopy,
  moreCopy,
}: {
  url: string;
  shareText: string;
  whatsappCopy: string;
  copyCopy: string;
  moreCopy: string;
}) {
  const [busy, setBusy] = useState(false);

  const waHref =
    "https://wa.me/?text=" + encodeURIComponent(`${shareText} ${url}`);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      pushAppToast({ kind: "success", body: "Enlace copiado al portapapeles." });
    } catch {
      pushAppToast({ kind: "error", body: "No se pudo copiar." });
    }
  };

  const onShare = async () => {
    if (!navigator.share) {
      pushAppToast({
        kind: "info",
        body: "Tu navegador no soporta compartir nativo. Usa “Copiar enlace”.",
      });
      return;
    }
    try {
      setBusy(true);
      await navigator.share({ title: "Cromio", text: shareText, url });
    } catch {
      // User dismissed the share sheet — silencioso.
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 space-y-2.5">
      <a
        href={waHref}
        target="_blank"
        rel="noreferrer"
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] text-sm font-bold text-white shadow-sh1"
      >
        <WhatsAppIcon className="h-5 w-5" />
        {whatsappCopy}
      </a>
      <button
        type="button"
        onClick={onCopy}
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-ink text-sm font-bold text-green-500 shadow-sh1"
      >
        <Copy size={18} strokeWidth={2.4} />
        {copyCopy}
      </button>
      <button
        type="button"
        onClick={onShare}
        disabled={busy}
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-white text-sm font-bold text-text shadow-sh1 disabled:opacity-60"
      >
        <Share2 size={18} strokeWidth={2.4} />
        {moreCopy}
      </button>
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.768.967-.941 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.04 2C6.504 2 2.005 6.5 2.005 12.034c0 1.768.462 3.494 1.339 5.014L2 22l5.135-1.345a10.05 10.05 0 004.9 1.247h.005c5.535 0 10.04-4.5 10.04-10.034 0-2.681-1.045-5.203-2.94-7.097A9.96 9.96 0 0012.04 2z" />
    </svg>
  );
}
