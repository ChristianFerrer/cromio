"use client";

import { useTransition } from "react";
import {
  acceptTradeRequest,
  rejectTradeRequest,
  cancelTradeRequest,
  markTradeDone,
} from "@/lib/trades/actions";
import { pushAppToast } from "@/lib/notifications/toast";

type Variant = "incoming" | "outgoing" | "accepted";

export function InboxActions({
  reqId,
  variant,
}: {
  reqId: string;
  variant: Variant;
}) {
  const [pending, start] = useTransition();

  const handle = (
    label: string,
    fn: () => Promise<{ ok: boolean; error?: string }>,
  ) => {
    start(async () => {
      const r = await fn();
      if (r.ok) {
        pushAppToast({ kind: "success", body: `${label} ✓` });
      } else {
        pushAppToast({
          kind: "error",
          body: r.error === "stale" ? "El intercambio ya no es válido." : label + " falló.",
        });
      }
    });
  };

  if (variant === "incoming") {
    return (
      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            handle("Aceptar", () => acceptTradeRequest(reqId))
          }
          className="flex-1 rounded-md bg-green-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          Aceptar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            handle("Rechazar", () => rejectTradeRequest(reqId))
          }
          className="flex-1 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-text-2 disabled:opacity-60"
        >
          Rechazar
        </button>
      </div>
    );
  }

  if (variant === "outgoing") {
    return (
      <div className="mt-2.5">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            handle("Cancelar", () => cancelTradeRequest(reqId))
          }
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-text-2 disabled:opacity-60"
        >
          Cancelar solicitud
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2.5">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          handle("Marcado como realizado", () => markTradeDone(reqId))
        }
        className="w-full rounded-md bg-green-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
      >
        Marcar realizado
      </button>
    </div>
  );
}
