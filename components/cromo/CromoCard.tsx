"use client";

import type { Sticker, StickerType } from "@/lib/types";
import { COUNTRY_BY_CODE } from "@/lib/data/countries";
import { Flag } from "./Flag";

const SIZES = {
  sm: { ratio: "78/110", num: "clamp(28px, 11vw, 40px)", type: 9.5, name: 10, flag: 18, fixed: null },
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

export type CromoSocial = {
  suppliers: number; // nearby users who have this cromo (could give to me)
  demanders: number; // nearby users who want this cromo (would receive from me)
};

export function CromoCard({
  sticker,
  count = 0,
  size = "md",
  onAdjust,
  onClick,
  selectBorder,
  social,
}: {
  sticker: Sticker;
  count?: number;
  size?: keyof typeof SIZES;
  onAdjust?: (delta: number) => void;
  onClick?: () => void;
  selectBorder?: string | null;
  social?: CromoSocial;
}) {
  const dim = SIZES[size];
  const country = sticker.team_code ? COUNTRY_BY_CODE[sticker.team_code] : undefined;
  const have = count > 0;
  const repe = count >= 2;

  const accent = country?.flag.colors[0] ?? "#066B40";
  const isLegendary = sticker.rarity === "legendary";
  const isSpecial = sticker.rarity === "special";

  // Border encoding:
  //  - missing → dashed gray, low emphasis
  //  - have (single) → 2px solid country accent (or green-900 if no team)
  //  - repe → 2px solid green-500, semantically "tradeable asset"
  //  - legendary/special override → gold borders
  const cardBorder = selectBorder
    ? `2px solid ${selectBorder}`
    : isLegendary
      ? "2px solid #F5C518"
      : isSpecial
        ? "2px solid #FDE68A"
        : repe
          ? "2px solid #10C56A"
          : have
            ? `2px solid ${accent}`
            : "1.5px dashed #D8D5C9";

  const centerColor = have ? "#1A1A1A" : "#8A8779";

  // Top-right slot — type pill only for legendary/special (visual identity);
  // common cards get a count badge when have>=1, nothing when missing.
  const showTypePill = isLegendary || isSpecial;
  const typePillStyle: React.CSSProperties = isLegendary
    ? {
        background: "linear-gradient(135deg, #FDE68A, #F5C518)",
        color: "#3A2C00",
        boxShadow: "0 1px 3px rgba(245,197,24,0.40)",
      }
    : {
        background: "rgba(245,197,24,.20)",
        color: "#A88008",
      };
  const typeLabel = isLegendary ? "LEGENDARY" : TYPE_LABEL[sticker.type] ?? sticker.type.toUpperCase();

  // Bottom social chip — only when nearby data justifies surfacing it.
  // Repe focuses on demand ("la quieren"), missing on supply ("la tienen").
  const socialChip = (() => {
    if (!social) return null;
    if (repe && social.demanders > 0) {
      return { label: `${social.demanders} la quieren`, tone: "demand" as const };
    }
    if (!have && social.suppliers > 0) {
      return { label: `${social.suppliers} la tienen`, tone: "supply" as const };
    }
    return null;
  })();

  const wrapperStyle: React.CSSProperties = dim.fixed
    ? { width: dim.fixed.w }
    : { width: "100%" };
  const cardStyle: React.CSSProperties = dim.fixed
    ? { width: dim.fixed.w, height: dim.fixed.h }
    : { width: "100%", aspectRatio: dim.ratio };

  const handleTap = () => {
    if (onClick) onClick();
  };

  return (
    <div className="flex flex-col items-stretch" style={wrapperStyle}>
      <button
        onClick={handleTap}
        className="relative flex shrink-0 overflow-hidden rounded-card text-left transition-transform active:scale-[0.97]"
        style={{
          ...cardStyle,
          background: "#FFFFFF",
          border: cardBorder,
        }}
      >
        {repe && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
            style={{ background: "linear-gradient(to top, rgba(16,197,106,.14), transparent)" }}
          />
        )}

        <div className="relative flex h-full w-full flex-col p-2">
          {/* Top row: flag (left) + slot (right): type pill (special) | count badge (have) | empty (missing) */}
          <div className="flex items-start justify-between gap-1.5">
            {country ? (
              <Flag country={country} size={dim.flag} />
            ) : (
              <span className="block" style={{ width: dim.flag, height: dim.flag }} />
            )}
            {showTypePill ? (
              <span
                className="inline-flex shrink-0 rounded-full px-1.5 py-0.5 font-display uppercase leading-none tracking-wider"
                style={{ fontSize: dim.type, ...typePillStyle }}
              >
                {typeLabel}
              </span>
            ) : have ? (
              <span
                className="inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 font-display leading-none"
                style={{
                  fontSize: dim.type,
                  background: repe ? "#10C56A" : "#1A1A1A",
                  color: "#FFFFFF",
                }}
              >
                ×{count}
              </span>
            ) : null}
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

          {/* Bottom row: social chip when relevant, otherwise name + position */}
          <div className="flex min-h-[14px] items-end justify-between gap-1.5">
            {socialChip ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-display leading-none"
                style={{
                  fontSize: dim.type,
                  background: socialChip.tone === "demand" ? "#10C56A" : "rgba(16,197,106,.15)",
                  color: socialChip.tone === "demand" ? "#FFFFFF" : "#066B40",
                  letterSpacing: "0.02em",
                }}
              >
                {socialChip.label}
              </span>
            ) : (
              <>
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
              </>
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
