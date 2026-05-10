"use client";

import { useState, useTransition } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Btn } from "@/components/ui/Btn";
import { reportUser } from "@/lib/moderation/actions";
import { pushAppToast } from "@/lib/notifications/toast";

type Reason = "spam" | "abuse" | "no_show" | "fake_profile" | "inappropriate" | "other";

const REASONS: Array<{ id: Reason; label: string; help: string }> = [
  { id: "spam", label: "Spam", help: "Mensajes repetitivos o publicidad." },
  { id: "abuse", label: "Acoso o lenguaje ofensivo", help: "Insultos, amenazas, lenguaje de odio." },
  { id: "no_show", label: "No se presentó", help: "Quedamos para intercambiar y no apareció." },
  { id: "fake_profile", label: "Perfil falso", help: "Suplanta a otra persona o datos inventados." },
  { id: "inappropriate", label: "Contenido inapropiado", help: "Foto o información indebida." },
  { id: "other", label: "Otro motivo", help: "Cuéntanos abajo." },
];

export function ReportUserSheet({
  alias,
  userId,
  onClose,
  onDone,
}: {
  alias: string;
  userId: string;
  onClose: () => void;
  onDone?: () => void;
}) {
  const [reason, setReason] = useState<Reason | null>(null);
  const [note, setNote] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!reason) return;
    startTransition(async () => {
      const r = await reportUser(userId, reason, note, alsoBlock);
      if (r?.error) {
        pushAppToast({
          kind: "error",
          title: "No se pudo enviar la denuncia",
          body: "Reintenta en un momento.",
        });
        return;
      }
      pushAppToast({
        kind: "success",
        title: "Denuncia enviada",
        body: alsoBlock
          ? `Hemos bloqueado a @${alias} y revisaremos tu reporte.`
          : "Revisaremos tu reporte cuanto antes.",
      });
      onDone?.();
      onClose();
    });
  };

  return (
    <Sheet title={`Denunciar a @${alias}`} onClose={onClose}>
      <p className="text-xs text-text-2">
        Tu reporte llega a moderación. Si bloqueas también, dejarás de ver a esta persona y ella a ti.
      </p>

      <div className="mt-4 space-y-1.5">
        {REASONS.map((r) => {
          const active = reason === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setReason(r.id)}
              aria-pressed={active}
              className={`flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                active
                  ? "border-green-500 bg-green-50"
                  : "border-line bg-white hover:bg-paper"
              }`}
            >
              <span
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                  active ? "border-green-500 bg-green-500 text-white" : "border-line"
                }`}
                aria-hidden
              >
                {active && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-text">{r.label}</span>
                <span className="mt-0.5 block text-xs text-text-2">{r.help}</span>
              </span>
            </button>
          );
        })}
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-bold uppercase tracking-wider text-text-2">
          Detalles (opcional)
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Cuéntanos qué pasó. Sin datos personales."
          className="mt-1 w-full resize-none rounded-md border border-line bg-white px-3.5 py-2 text-sm outline-none focus:border-green-500"
        />
      </label>

      <label className="mt-3 flex items-center gap-3 rounded-md border border-line bg-white p-3">
        <input
          type="checkbox"
          checked={alsoBlock}
          onChange={(e) => setAlsoBlock(e.target.checked)}
          className="h-4 w-4 accent-green-500"
        />
        <span className="text-sm">
          Bloquear también a <b>@{alias}</b>
          <span className="block text-[11px] text-text-2">
            No volveréis a apareceros en mapa, búsqueda, ni favoritos.
          </span>
        </span>
      </label>

      <div className="mt-5 flex gap-2">
        <Btn kind="ghost" full onClick={onClose} disabled={pending}>
          Cancelar
        </Btn>
        <Btn
          kind="primaryVibrant"
          full
          disabled={!reason || pending}
          onClick={submit}
        >
          {pending ? "Enviando…" : "Enviar denuncia"}
        </Btn>
      </div>
    </Sheet>
  );
}
