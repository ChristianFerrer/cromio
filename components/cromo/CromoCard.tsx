"use client";

import type { Sticker } from "@/lib/types";
import { COUNTRY_BY_CODE } from "@/lib/data/countries";
import { Flag } from "./Flag";

const SIZES = {
  sm: { ratio: "78/110", num: "clamp(18px, 6.5vw, 28px)", pos: 9, name: 10, flag: 18, fixed: null },
  md: { ratio: "102/144", num: "clamp(22px, 7.5vw, 34px)", pos: 10, name: 12, flag: 22, fixed: null },
  lg: { ratio: "140/200", num: "42px", pos: 11, name: 14, flag: 28, fixed: { w: 140, h: 200 } },
  xl: { ratio: "200/286", num: "60px", pos: 13, name: 16, flag: 40, fixed: { w: 200, h: 286 } },
} as const;

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

  const accent = country?.flag.colors[0] ?? "#0B6E3F";
  const isSpecial = sticker.rarity !== "common";

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
          background: have ? `linear-gradient(160deg, ${accent}22, #fff)` : "#F5F4EE",
          border: selectBorder
            ? `2px solid ${selectBorder}`
            : have
              ? `1px solid ${accent}55`
              : `1px dashed #D8D5C9`,
          opacity: have ? 1 : 0.92,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: have
              ? `radial-gradient(120% 100% at 0% 0%, ${accent}33, transparent 60%)`
              : "transparent",
          }}
        />

        <div className="relative flex h-full w-full flex-col p-2">
          <div className="flex items-start justify-between gap-1">
            <span
              className="font-display tabular leading-none"
              style={{ fontSize: dim.num, color: have ? accent : "#8A8779" }}
            >
              {sticker.code}
            </span>
            {country && <Flag country={country} size={dim.flag} />}
          </div>

          <div className="mt-auto flex flex-col gap-0.5">
            {sticker.position && (
              <span
                className="font-display uppercase tracking-wider text-mute"
                style={{ fontSize: dim.pos }}
              >
                {sticker.position}
              </span>
            )}
            {sticker.player_name && (
              <span
                className="line-clamp-1 font-semibold leading-tight"
                style={{ fontSize: dim.name, color: have ? "#1A1A1A" : "#5C5A50" }}
              >
                {sticker.player_name}
              </span>
            )}
            {sticker.city && (
              <span
                className="line-clamp-1 leading-tight text-text-2"
                style={{ fontSize: dim.name }}
              >
                {sticker.city}
              </span>
            )}
          </div>

          {repe && (
            <span
              className="absolute right-1.5 top-1.5 rounded-full bg-gold px-1.5 py-0.5 font-display text-[10px] text-ink"
            >
              ×{count}
            </span>
          )}
          {isSpecial && (
            <span
              className="absolute left-1 bottom-1 rounded-full px-1 py-0.5 font-display text-[9px]"
              style={{
                background:
                  sticker.rarity === "legendary"
                    ? "linear-gradient(135deg, #F0DA8E, #D4AF37)"
                    : "rgba(212,175,55,.18)",
                color: sticker.rarity === "legendary" ? "#3A2C00" : "#8C7220",
              }}
            >
              {sticker.rarity === "legendary" ? "LEGENDARY" : "ESPECIAL"}
            </span>
          )}
        </div>
      </button>

      {onAdjust && (
        <div className="mt-1.5 flex items-center justify-between">
          <button
            onClick={() => onAdjust(-1)}
            disabled={count === 0}
            className="grid h-7 w-7 place-items-center rounded-full border border-line bg-white text-base font-bold text-text-2 disabled:opacity-30"
          >
            −
          </button>
          <span className="font-display tabular text-base">{count}</span>
          <button
            onClick={() => onAdjust(+1)}
            className="grid h-7 w-7 place-items-center rounded-full bg-green-500 text-base font-bold text-white"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
