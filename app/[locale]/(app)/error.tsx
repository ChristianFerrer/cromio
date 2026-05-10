"use client";

import { useEffect } from "react";
import { RefreshCw, Home } from "lucide-react";
import { Btn } from "@/components/ui/Btn";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[cromio] route error:", error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-paper text-text-2">
        <RefreshCw size={28} strokeWidth={2} />
      </div>
      <div>
        <h1 className="font-display text-3xl">Algo no salió bien</h1>
        <p className="mt-1 text-sm text-text-2">
          La pantalla no pudo cargar. Suele resolverse reintentando.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-2">
        <Btn kind="primaryVibrant" full size="lg" onClick={reset}>
          Reintentar
        </Btn>
        <a
          href="/album"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-line bg-white text-sm font-semibold text-text"
        >
          <Home size={14} /> Volver al álbum
        </a>
      </div>
      {error.digest && (
        <p className="text-[11px] text-mute">Ref: {error.digest}</p>
      )}
    </main>
  );
}
