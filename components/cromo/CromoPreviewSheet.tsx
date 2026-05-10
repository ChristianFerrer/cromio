"use client";

import { useEffect, useState, useTransition } from "react";
import { Heart, Share2 } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { CromoCard } from "@/components/cromo/CromoCard";
import { STICKERS_BY_N, TOTAL_STICKERS } from "@/lib/data/stickers";
import { COUNTRY_BY_CODE } from "@/lib/data/countries";
import { shareOrCopy } from "@/lib/share/client";
import { createClient } from "@/lib/supabase/client";
import { toggleWishlist } from "@/lib/wishlist/actions";
import { pushAppToast } from "@/lib/notifications/toast";

export function CromoPreviewSheet({
  n,
  onClose,
}: {
  n: number;
  onClose: () => void;
}) {
  const sticker = STICKERS_BY_N.get(n);
  if (!sticker) {
    return (
      <Sheet title="Cromo no encontrado" onClose={onClose}>
        <p className="text-sm text-text-2">
          No existe un cromo #{n}. El número debe estar entre 1 y {TOTAL_STICKERS}.
        </p>
      </Sheet>
    );
  }
  const country = sticker.team_code ? COUNTRY_BY_CODE[sticker.team_code] : undefined;
  const shareText = [
    `Cromo #${sticker.n} (${sticker.code})`,
    country?.name,
    sticker.player_name,
  ]
    .filter(Boolean)
    .join(" · ");

  const [wanted, setWanted] = useState(false);
  const [wishKnown, setWishKnown] = useState(false);
  const [, startWish] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setWishKnown(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setWishKnown(true);
        return;
      }
      const { data } = await supabase
        .from("user_wishlist")
        .select("sticker_n")
        .eq("user_id", user.id)
        .eq("sticker_n", sticker.n)
        .maybeSingle();
      if (cancelled) return;
      setWanted(!!data);
      setWishKnown(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [sticker.n]);

  const onToggleWish = () => {
    const next = !wanted;
    setWanted(next);
    startWish(async () => {
      const r = await toggleWishlist(sticker.n);
      if (r?.error) {
        setWanted(!next);
        pushAppToast({ kind: "error", body: "No se pudo actualizar la lista de deseos." });
        return;
      }
      pushAppToast({
        kind: "success",
        body: next
          ? `#${sticker.n} añadido a tu lista de deseos.`
          : `#${sticker.n} quitado de tu lista de deseos.`,
      });
    });
  };

  return (
    <Sheet title={`Cromo #${sticker.n}`} onClose={onClose}>
      <div className="flex gap-4">
        <div className="w-32 shrink-0">
          <CromoCard sticker={sticker} count={1} size="md" />
        </div>
        <dl className="min-w-0 flex-1 text-sm">
          <Row label="Código" value={sticker.code} />
          {country && <Row label="Selección" value={country.name} />}
          {sticker.player_name && <Row label="Jugador" value={sticker.player_name} />}
          {sticker.position && <Row label="Posición" value={sticker.position} />}
          {sticker.city && <Row label="Ciudad" value={sticker.city} />}
          <Row label="Tipo" value={prettyType(sticker.type)} />
          <Row label="Rareza" value={prettyRarity(sticker.rarity)} />
        </dl>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onToggleWish}
          disabled={!wishKnown}
          aria-pressed={wanted}
          className={`flex items-center justify-center gap-2 rounded-md border py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
            wanted
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-line bg-white text-text hover:bg-paper"
          }`}
        >
          <Heart
            size={14}
            strokeWidth={2.2}
            fill={wanted ? "currentColor" : "none"}
          />
          {wanted ? "En tu lista de deseos" : "Añadir a deseos"}
        </button>
        <button
          type="button"
          onClick={() =>
            shareOrCopy({
              title: shareText,
              text: "Mira este cromo del Mundial 2026 en Cromio.",
              path: `/album?cromo=${sticker.n}`,
            })
          }
          className="flex items-center justify-center gap-2 rounded-md border border-line bg-white py-2.5 text-sm font-semibold text-text hover:bg-paper"
        >
          <Share2 size={14} strokeWidth={2.2} /> Compartir
        </button>
      </div>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-line py-1.5 last:border-0">
      <dt className="text-xs uppercase tracking-wider text-text-2">{label}</dt>
      <dd className="text-right font-medium text-text">{value}</dd>
    </div>
  );
}

function prettyType(t: string) {
  switch (t) {
    case "team_badge": return "Escudo";
    case "team_photo": return "Foto de equipo";
    case "player": return "Jugador";
    case "host_city": return "Ciudad anfitriona";
    case "foil_intro": return "Especial intro";
    default: return t;
  }
}

function prettyRarity(r: string) {
  switch (r) {
    case "common": return "Normal";
    case "special": return "Especial";
    case "legendary": return "Legendaria";
    default: return r;
  }
}
