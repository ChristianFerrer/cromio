"use client";

import { useMemo, useState } from "react";
import { Search, Plus, Minus } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { CromoCard } from "@/components/cromo/CromoCard";
import { STICKERS_BY_N, TOTAL_STICKERS } from "@/lib/data/stickers";

export function AddCromoSheet({
  collection,
  onClose,
  onAdjust,
}: {
  collection: Map<number, number>;
  onClose: () => void;
  onAdjust: (n: number, delta: number) => void;
}) {
  const [q, setQ] = useState("");
  const trimmed = q.trim();
  const asNumber = Number(trimmed);
  const isValidNumber =
    Number.isInteger(asNumber) && asNumber >= 1 && asNumber <= TOTAL_STICKERS;

  const sticker = useMemo(() => {
    if (isValidNumber) return STICKERS_BY_N.get(asNumber) ?? null;
    return null;
  }, [isValidNumber, asNumber]);

  const count = sticker ? collection.get(sticker.n) ?? 0 : 0;

  return (
    <Sheet title="Añadir cromo" onClose={onClose}>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-text-2">
          Número del cromo
        </span>
        <div className="mt-1 flex items-center gap-2 rounded-md border border-line bg-white px-3.5 focus-within:border-green-500">
          <Search size={16} className="text-text-2" />
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={q}
            onChange={(e) => setQ(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder={`1 — ${TOTAL_STICKERS}`}
            autoFocus
            className="h-11 flex-1 bg-transparent text-base outline-none"
          />
        </div>
        <span className="mt-1 block text-[11px] text-text-2">
          Introduce el número impreso en el cromo.
        </span>
      </label>

      <div className="mt-5 grid grid-cols-[120px_1fr] gap-4">
        <div>
          {sticker ? (
            <CromoCard sticker={sticker} count={count} size="sm" />
          ) : (
            <div className="grid aspect-[78/110] place-items-center rounded-card border border-dashed border-line bg-paper text-xs text-text-2">
              {trimmed && !isValidNumber ? "Número fuera de rango" : "Vista previa"}
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center gap-2">
          {sticker ? (
            <>
              <p className="font-display text-2xl leading-none">#{sticker.n}</p>
              <p className="text-xs text-text-2">
                {sticker.team_code ? sticker.team_code : sticker.type.replace("_", " ")}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => sticker && onAdjust(sticker.n, -1)}
                  disabled={count === 0}
                  className="grid h-11 w-11 place-items-center rounded-md border border-line text-text disabled:opacity-30"
                  aria-label="Quitar uno"
                >
                  <Minus size={18} strokeWidth={2.2} />
                </button>
                <span className="font-display text-3xl tabular leading-none">
                  {count}
                </span>
                <button
                  type="button"
                  onClick={() => sticker && onAdjust(sticker.n, +1)}
                  className="grid h-11 w-11 place-items-center rounded-md text-white"
                  style={{ backgroundColor: "#10C56A" }}
                  aria-label="Añadir uno"
                >
                  <Plus size={18} strokeWidth={2.2} />
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-text-2">
              Escribe un número entre 1 y {TOTAL_STICKERS}.
            </p>
          )}
        </div>
      </div>
    </Sheet>
  );
}
