"use client";

import { useEffect } from "react";
import { Btn } from "@/components/ui/Btn";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[cromio] global error:", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="bg-bone">
        <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col items-center justify-center px-6 text-center">
          <div className="font-display text-6xl text-green-700">!</div>
          <h1 className="mt-3 font-display text-3xl">Algo se rompió</h1>
          <p className="mt-2 text-sm text-text-2">
            La app encontró un error inesperado. Esto suele pasar por un módulo
            mal configurado.
          </p>
          {error.digest && (
            <p className="mt-2 font-mono text-[10px] text-mute">
              digest: {error.digest}
            </p>
          )}
          <Btn kind="primaryVibrant" size="lg" className="mt-6" onClick={reset}>
            Reintentar
          </Btn>
        </div>
      </body>
    </html>
  );
}
