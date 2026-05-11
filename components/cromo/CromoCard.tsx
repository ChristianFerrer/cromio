"use client";

import type { Sticker, StickerType } from "@/lib/types";
import { COUNTRY_BY_CODE } from "@/lib/data/countries";
import { Flag } from "./Flag";

const SIZES = {
  sm: { ratio: "78/110", code: "clamp(22px, 8vw, 30px)", type: 10, flag: 18, fixed: null },
  md: { ratio: "102/144", code: "clamp(28px, 10vw, 40px)", type: 12, flag: 22, fixed: null },
  lg: { ratio: "140/200", code: "44px", type: 14, flag: 26, fixed: { w: 140, h: 200 } },
  xl: { ratio: "200/286", code: "60px", type: 17, flag: 34, fixed: { w: 200, h: 286 } },
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

  // Border + text colors driven by state.
  //   missing → dashed gray
  //   have    → green solid 2px
  //   repe    → red   solid 2px
  //   legendary overrides to gold.
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
  const cardStyle: React.CSSProperties = dim.fixed
    ? { width: dim.fixed.w, height: dim.fixed.h }
    : { width: "100%", aspectRatio: dim.ratio };

  return (
    <div className="flex flex-col items-stretch" style={wrapperStyle}>
      <button
        onClick={onClick}
        className="relative flex shrink-0 overflow-hidden rounded-card text-left transition-transform active:scale-[0.97]"
        style={{
          ...cardStyle,
          background: "#FFFFFF",
          border: cardBorder,
        }}
      >
        <div className="relative flex h-full w-full flex-col p-2.5">
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
              <Flag country={country} size={dim.flag} />
            ) : (
              <span className="block" style={{ width: dim.flag, height: dim.flag }} />
            )}
          </div>

          {/* Type label centered under the code */}
          <div className="mt-1 text-center">
            <span
              className="font-display uppercase leading-none tracking-wider"
              style={{ fontSize: dim.type, color: typeColor }}
            >
              {typeLabel}
            </span>
          </div>

          {/* Flexible bottom space keeps the card height balanced */}
          <div className="flex-1" />
        </div>
      </button>

      {onAdjust && (
        <div className="mt-1.5 flex items-center justify-between">
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
  );
}

