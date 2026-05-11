"use client";

import type { Sticker, StickerType } from "@/lib/types";
import { COUNTRY_BY_CODE } from "@/lib/data/countries";
import { Flag } from "./Flag";

const SIZES = {
  sm: { code: "clamp(22px, 7.5vw, 30px)", type: "clamp(12px, 4.2vw, 16px)", flag: 16, pad: 7, fixed: null },
  md: { code: "clamp(36px, 13vw, 50px)", type: "clamp(13px, 4vw, 16px)", flag: 22, pad: 10, fixed: null },
  lg: { code: "56px", type: "16px", flag: 28, pad: 12, fixed: { w: 160 } },
  xl: { code: "80px", type: "20px", flag: 38, pad: 14, fixed: { w: 220 } },
} as const;

const TYPE_LABEL: Record<StickerType, string> = {
  team_badge: "ESCUDO",
  team_photo: "EQUIPO",
  player: "JUGADOR",
  host_city: "ESTADIO",
  foil_intro: "INTRO",
};

export function CromoCard({
  sticker,
  count = 0,
  size = "md",
  onAdjust,
  onClick,
  selectBorder,
}: {
  sticker: Sticker;
  count?: number;
  size?: keyof typeof SIZES;
  onAdjust?: (delta: number) => void;
  onClick?: () => void;
  selectBorder?: string | null;
}) {
  const dim = SIZES[size];
  const country = sticker.team_code ? COUNTRY_BY_CODE[sticker.team_code] : undefined;
  const have = count > 0;
  const repe = count >= 2;
  const isLegendary = sticker.rarity === "legendary";

  // Border + text colors per state. Counter row lives inside the card.
  //   missing → dashed gray
  //   have    → 2px solid green
  //   repe    → 2px solid red
  //   legendary → 2px solid gold
  const cardBorder = selectBorder
    ? `2px solid ${selectBorder}`
    : isLegendary
      ? "2px solid #F5C518"
      : repe
        ? "2px solid #EF1F3C"
        : have
          ? "2px solid #10C56A"
          : "1.5px dashed #D8D5C9";

  const codeColor = have ? "#1A1A1A" : "#B5B2A6";
  const typeColor = have ? "#5C5A50" : "#B5B2A6";

  const typeLabel = isLegendary
    ? "LEGENDARY"
    : TYPE_LABEL[sticker.type] ?? sticker.type.toUpperCase();

  const wrapperStyle: React.CSSProperties = dim.fixed
    ? { width: dim.fixed.w }
    : { width: "100%" };

  return (
    <div className="flex flex-col items-stretch" style={wrapperStyle}>
      <div
        onClick={onClick}
        role={onClick ? "button" : undefined}
        className="relative flex flex-col overflow-hidden rounded-card"
        style={{ background: "#FFFFFF", border: cardBorder }}
      >
        <div className="flex flex-col" style={{ padding: dim.pad }}>
          {/* Top row: big code (left) + flag (right) */}
          <div className="flex items-start justify-between gap-2">
            <span
              className="font-display tabular leading-none"
              style={{
                fontSize: dim.code,
                color: codeColor,
                letterSpacing: "-0.02em",
              }}
            >
              {sticker.code}
            </span>
            {country ? (
              <span
                className="inline-block shrink-0 overflow-hidden"
                style={{
                  border: "1px solid #D8D5C9",
                  borderRadius: Math.round(dim.flag / 6) + 1,
                  lineHeight: 0,
                }}
              >
                <Flag country={country} size={dim.flag} />
              </span>
            ) : (
              <span className="block" style={{ width: dim.flag, height: dim.flag }} />
            )}
          </div>

          {/* Type label centered just under the code */}
          <div className="mt-1 text-center">
            <span
              className="font-display uppercase leading-none tracking-wider"
              style={{ fontSize: dim.type, color: typeColor }}
            >
              {typeLabel}
            </span>
          </div>
        </div>

        {onAdjust && (
          <div
            className="flex items-center justify-between gap-2 border-t border-line/60"
            style={{ padding: `${Math.max(dim.pad - 2, 6)}px ${dim.pad}px` }}
          >
            <button
              onClick={() => onAdjust(-1)}
              disabled={count === 0}
              aria-label="Quitar uno"
              className={`grid h-7 w-7 place-items-center rounded-full text-base font-bold transition-colors disabled:opacity-30 ${
                repe
                  ? "border border-transparent bg-red-500 text-white"
                  : "border border-line bg-white text-text-2"
              }`}
            >
              −
            </button>
            <span
              className={`font-display tabular text-base ${
                repe ? "text-red-600" : have ? "text-text" : "text-mute"
              }`}
            >
              {count}
            </span>
            <button
              onClick={() => onAdjust(+1)}
              aria-label="Añadir uno"
              className="grid h-7 w-7 place-items-center rounded-full text-base font-bold text-white"
              style={{ backgroundColor: "#10C56A" }}
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


