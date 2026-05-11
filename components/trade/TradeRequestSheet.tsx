"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Btn } from "@/components/ui/Btn";
import { CromoCard } from "@/components/cromo/CromoCard";
import { STICKERS_BY_N } from "@/lib/data/stickers";
import {
  acceptTradeRequest,
  cancelTradeRequest,
  markTradeDone,
  rejectTradeRequest,
} from "@/lib/trades/actions";
import type { TradeRequestRow } from "@/lib/trades/queries";
import { pushAppToast } from "@/lib/notifications/toast";

type Props = {
  req: TradeRequestRow;
  meId: string;
  otherAlias: string;
  onClose: () => void;
  onChanged: () => void;
};

export function TradeRequestSheet({
  req,
  meId,
  otherAlias,
  onClose,
  onChanged,
}: Props) {
  const [pending, startTransition] = useTransition();

  const iAmSender = req.from_user_id === meId;
  // Normalise to the viewer's POV: "recibo" / "entrego"
  const recibo = iAmSender ? req.items.to_gives : req.items.from_gives;
  const entrego = iAmSender ? req.items.from_gives : req.items.to_gives;

  const title =
    req.status === "pending" && iAmSender
      ? "Solicitud enviada"
      : req.status === "pending"
        ? `Solicitud de @${otherAlias}`
        : "Intercambio acordado";

  const subtitle =
    req.status === "pending" && iAmSender
      ? "Esperando que acepte. Puedes cancelar si te equivocaste."
      : req.status === "pending"
        ? "Revisa los cromos y decide."
        : "Cuando os encontréis, marca como realizado para actualizar el álbum.";

  const handle = (
    fn: () => Promise<{ ok: boolean; error?: string }>,
    okMsg: string,
  ) => {
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) {
        const msg =
          r.error === "stale"
            ? "El intercambio ya no es válido. Los cromos cambiaron."
            : r.error === "empty_trade"
              ? "No hay cromos para intercambiar."
              : r.error === "already_pending"
                ? "Ya hay una solicitud activa con este usuario."
                : "Algo falló. Inténtalo de nuevo.";
        pushAppToast({ kind: "error", body: msg });
        return;
      }
      pushAppToast({ kind: "success", body: okMsg });
      onChanged();
      onClose();
    });
  };

  return (
    <Sheet title={title} onClose={onClose}>
      <p className="px-4 text-xs leading-snug text-text-2">{subtitle}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 px-3 pb-4">
        <Column label="Recibes" tint="green" items={recibo} />
        <Column label="Entregas" tint="red" items={entrego} />
      </div>

      <div className="flex flex-col gap-2 border-t border-line bg-white px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
        {req.status === "pending" && !iAmSender && (
          <>
            <Btn
              kind="primaryVibrant"
              full
              size="lg"
              disabled={pending}
              icon={pending ? <Loader2 size={16} className="animate-spin" /> : undefined}
              onClick={() => handle(() => acceptTradeRequest(req.id), "Solicitud aceptada")}
            >
              Aceptar
            </Btn>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                handle(() => rejectTradeRequest(req.id), "Solicitud rechazada")
              }
              className="h-12 rounded-xl border border-line bg-white text-sm font-bold text-text-2 disabled:opacity-50"
            >
              Rechazar
            </button>
          </>
        )}

        {req.status === "pending" && iAmSender && (
          <button
            type="button"
            disabled={pending}
            onClick={() => handle(() => cancelTradeRequest(req.id), "Solicitud cancelada")}
            className="h-12 rounded-xl border border-line bg-white text-sm font-bold text-text-2 disabled:opacity-50"
          >
            Cancelar solicitud
          </button>
        )}

        {req.status === "accepted" && (
          <>
            <Btn
              kind="primaryVibrant"
              full
              size="lg"
              disabled={pending}
              icon={pending ? <Loader2 size={16} className="animate-spin" /> : undefined}
              onClick={() =>
                handle(() => markTradeDone(req.id), "Intercambio completado")
              }
            >
              Marcar como realizado
            </Btn>
            <button
              type="button"
              disabled={pending}
              onClick={() => handle(() => cancelTradeRequest(req.id), "Cancelado")}
              className="h-10 rounded-xl border border-line bg-white text-xs font-semibold text-text-2 disabled:opacity-50"
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </Sheet>
  );
}

function Column({
  label,
  tint,
  items,
}: {
  label: string;
  tint: "green" | "red";
  items: { n: number; qty: number }[];
}) {
  return (
    <div className="rounded-md border border-line bg-paper p-2">
      <p
        className={`mb-2 text-center text-[10px] font-bold uppercase tracking-wider ${
          tint === "green" ? "text-green-700" : "text-red-600"
        }`}
      >
        {label} ({items.length})
      </p>
      {items.length === 0 ? (
        <p className="py-6 text-center text-[11px] text-text-2">—</p>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {items.map((it) => {
            const s = STICKERS_BY_N.get(it.n);
            if (!s) return null;
            return <CromoCard key={it.n} sticker={s} count={it.qty} size="sm" />;
          })}
        </div>
      )}
    </div>
  );
}
