"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { CromoCard } from "@/components/cromo/CromoCard";
import { CromoPreviewSheet } from "@/components/cromo/CromoPreviewSheet";
import { STICKERS_BY_N } from "@/lib/data/stickers";
import { toggleWishlist } from "@/lib/wishlist/actions";
import { pushAppToast } from "@/lib/notifications/toast";

export function WishlistGrid({ initialNumbers }: { initialNumbers: number[] }) {
  const [numbers, setNumbers] = useState(initialNumbers);
  const [previewN, setPreviewN] = useState<number | null>(null);
  const [pendingN, setPendingN] = useState<number | null>(null);
  const [, startRemove] = useTransition();

  const remove = (n: number) => {
    setPendingN(n);
    startRemove(async () => {
      const r = await toggleWishlist(n);
      setPendingN(null);
      if (r?.error) {
        pushAppToast({ kind: "error", body: "No se pudo quitar." });
        return;
      }
      setNumbers((prev) => prev.filter((x) => x !== n));
    });
  };

  return (
    <>
      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {numbers.map((n) => {
          const sticker = STICKERS_BY_N.get(n);
          if (!sticker) return null;
          return (
            <div key={n} className="relative">
              <button
                type="button"
                onClick={() => setPreviewN(n)}
                aria-label={`Ver cromo #${n}`}
                className="block w-full text-left"
              >
                <CromoCard sticker={sticker} count={0} size="sm" />
              </button>
              <button
                type="button"
                onClick={() => remove(n)}
                disabled={pendingN === n}
                aria-label={`Quitar #${n} de la lista de deseos`}
                className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-red-600 shadow-sh1 disabled:opacity-50"
              >
                <Heart size={13} strokeWidth={2.2} fill="currentColor" />
              </button>
            </div>
          );
        })}
      </div>
      {previewN !== null && (
        <CromoPreviewSheet n={previewN} onClose={() => setPreviewN(null)} />
      )}
    </>
  );
}
