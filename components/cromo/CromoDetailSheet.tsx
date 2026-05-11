"use client";

import Link from "next/link";
import { ArrowRight, Minus, Plus } from "lucide-react";
import type { Sticker } from "@/lib/types";
import { Sheet } from "@/components/ui/Sheet";
import { CromoCard, type CromoSocial } from "@/components/cromo/CromoCard";

export function CromoDetailSheet({
  sticker,
  count,
  social,
  onAdjust,
  onClose,
}: {
  sticker: Sticker;
  count: number;
  social?: CromoSocial;
  onAdjust: (delta: number) => void;
  onClose: () => void;
}) {
  const repe = count >= 2;
  const have = count > 0;

  return (
    <Sheet title={`Cromo · ${sticker.code}`} onClose={onClose}>
      <div className="grid grid-cols-[140px_1fr] gap-4">
        <CromoCard sticker={sticker} count={count} size="lg" social={social} />

        <div className="flex min-w-0 flex-col">
          <p className="font-display text-3xl leading-none">#{sticker.n}</p>
          {sticker.player_name && (
            <p className="mt-1 truncate text-sm font-bold text-text">
              {sticker.player_name}
            </p>
          )}
          {!sticker.player_name && sticker.city && (
            <p className="mt-1 truncate text-sm font-bold text-text">{sticker.city}</p>
          )}
          {sticker.position && (
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-mute">
              {sticker.position}
            </p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onAdjust(-1)}
              disabled={count === 0}
              aria-label="Quitar uno"
              className="grid h-11 w-11 place-items-center rounded-md border border-line text-text disabled:opacity-30"
            >
              <Minus size={18} strokeWidth={2.2} />
            </button>
            <span className="font-display text-3xl tabular leading-none">{count}</span>
            <button
              type="button"
              onClick={() => onAdjust(+1)}
              aria-label="Añadir uno"
              className="grid h-11 w-11 place-items-center rounded-md text-white"
              style={{ backgroundColor: "#10C56A" }}
            >
              <Plus size={18} strokeWidth={2.2} />
            </button>
          </div>

          {!have && (
            <p className="mt-2 text-[11px] text-text-2">
              Toca <b>+</b> cuando consigas este cromo en la vida real.
            </p>
          )}
          {repe && (
            <p className="mt-2 text-[11px] text-text-2">
              Tienes {count - 1} {count - 1 === 1 ? "repetida" : "repetidas"} de este cromo.
            </p>
          )}
        </div>
      </div>

      {social && (social.suppliers > 0 || social.demanders > 0) && (
        <div className="mt-5 rounded-md border border-line bg-paper/40 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-2">
            A 5 km de ti
          </p>
          <div className="mt-2 space-y-1.5 text-sm">
            {!have && social.suppliers > 0 && (
              <p>
                <b className="font-display text-2xl tabular text-green-700">
                  {social.suppliers}
                </b>{" "}
                {social.suppliers === 1 ? "coleccionista la tiene" : "coleccionistas la tienen"}
              </p>
            )}
            {repe && social.demanders > 0 && (
              <p>
                <b className="font-display text-2xl tabular text-green-700">
                  {social.demanders}
                </b>{" "}
                {social.demanders === 1 ? "coleccionista la quiere" : "coleccionistas la quieren"}
              </p>
            )}
          </div>
          <Link
            href="/mapa"
            onClick={onClose}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-green-500 px-4 py-2.5 text-xs font-bold text-white shadow-sh1"
          >
            Ver en el radar
            <ArrowRight size={14} strokeWidth={2.2} />
          </Link>
        </div>
      )}
    </Sheet>
  );
}
