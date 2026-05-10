"use client";

import { Sheet } from "@/components/ui/Sheet";
import { CromoCard } from "@/components/cromo/CromoCard";
import { STICKERS_BY_N, TOTAL_STICKERS } from "@/lib/data/stickers";
import { COUNTRY_BY_CODE } from "@/lib/data/countries";

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
