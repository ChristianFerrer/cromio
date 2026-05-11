"use client";

import type { Sticker, StickerType } from "@/lib/types";
import { COUNTRY_BY_CODE } from "@/lib/data/countries";
import { Flag } from "./Flag";

const SIZES = {
  sm: { ratio: "78/110", num: "clamp(28px, 11vw, 44px)", type: 9.5, name: 10, flag: 18, fixed: null },
  md: { ratio: "102/144", num: "clamp(36px, 13vw, 58px)", type: 10.5, name: 12, flag: 22, fixed: null },
  lg: { ratio: "140/200", num: "64px", type: 11, name: 14, flag: 26, fixed: { w: 140, h: 200 } },
  xl: { ratio: "200/286", num: "92px", type: 13, name: 16, flag: 34, fixed: { w: 200, h: 286 } },
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

  const accent = country?.flag.colors[0] ?? "#155F6B";
  const isLegendary = sticker.rarity === "legendary";
  const isSpecial = sticker.rarity === "special";

  // Card always sits on a flat white background. State is conveyed by
  // the border: black when the user has the cromo, red when it's a
  // duplicate. The center code stays black either way; missing cromos
  // get a muted dashed border + gray code to feel inactive.
  const centerColor = have ? "#1A1A1A" : "#8A8779";
  const cardBorder = selectBorder
    ? `2px solid ${selectBorder}`
    : repe
      ? "1.5px solid #EF1F3C"
      : have
        ? "1.5px solid #1A1A1A"
        : "1px dashed #D8D5C9";

  const typeLabel = isLegendary
    ? "LEGENDARY"
    : TYPE_LABEL[sticker.type] ?? sticker.type.toUpperCase();

  // Type pill styling: legendary → gold gradient, special → soft gold,
  // common → neutral ink (uses the country flag accent only as a soft
  // tint of the label; bg stays neutral so the white card reads clean).
  const typePillStyle: React.CSSProperties = isLegendary
    ? {
        background: "linear-gradient(135deg, #FDE68A, #F5C518)",
        color: "#3A2C00",
        boxShadow: "0 1px 3px rgba(245,197,24,0.40)",
      }
    : isSpecial
      ? {
          background: "rgba(245,197,24,.20)",
          color: "#A88008",
        }
      : {
          background: have ? "rgba(0,0,0,.06)" : "rgba(0,0,0,.04)",
          color: have ? accent : "#5C5A50",
        };

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
        <div className="relative flex h-full w-full flex-col p-2">
          {/* Top row: flag (left) + type pill (right) */}
          <div className="flex items-start justify-between gap-1.5">
            {country ? (
              <Flag country={country} size={dim.flag} />
            ) : (
              <span className="block" style={{ width: dim.flag, height: dim.flag }} />
            )}
            <span
              className="inline-flex shrink-0 rounded-full px-1.5 py-0.5 font-display uppercase leading-none tracking-wider"
              style={{ fontSize: dim.type, ...typePillStyle }}
            >
              {typeLabel}
            </span>
          </div>

          {/* Center: big sticker code */}
          <div className="flex flex-1 items-center justify-center px-1">
            <span
              className="font-display tabular leading-none"
              style={{
                fontSize: dim.num,
                color: centerColor,
                letterSpacing: "-0.02em",
              }}
            >
              {sticker.code}
            </span>
          </div>

          {/* Bottom: player / city (left) + position (right) */}
          <div className="flex min-h-[14px] items-end justify-between gap-1.5">
            <span className="min-w-0 flex-1">
              {sticker.player_name && (
                <span
                  className="block line-clamp-1 font-semibold leading-tight"
                  style={{ fontSize: dim.name, color: have ? "#1A1A1A" : "#5C5A50" }}
                >
                  {sticker.player_name}
                </span>
              )}
              {!sticker.player_name && sticker.city && (
                <span
                  className="block line-clamp-1 leading-tight text-text-2"
                  style={{ fontSize: dim.name }}
                >
                  {sticker.city}
                </span>
              )}
            </span>
            {sticker.position && (
              <span
                className="shrink-0 font-display uppercase leading-none tracking-wider text-mute"
                style={{ fontSize: dim.name }}
              >
                {sticker.position}
              </span>
            )}
          </div>
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
              repe ? "text-red-600" : "text-text"
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
