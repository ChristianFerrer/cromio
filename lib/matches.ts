import type { MatchResult, Sticker } from "./types";
import { STICKERS } from "./data/stickers";

export function buildMatch(
  myCollection: Map<number, number>,
  theirCollection: Map<number, number>,
): MatchResult {
  const youGet: Sticker[] = [];
  const theyGet: Sticker[] = [];

  for (const s of STICKERS) {
    const me = myCollection.get(s.n) ?? 0;
    const them = theirCollection.get(s.n) ?? 0;
    if (me === 0 && them >= 2) youGet.push(s);
    if (me >= 2 && them === 0) theyGet.push(s);
  }

  return {
    youGet: youGet.map((s) => ({ ...s, count: theirCollection.get(s.n) ?? 0 })),
    theyGet: theyGet.map((s) => ({ ...s, count: myCollection.get(s.n) ?? 0 })),
  };
}

export function fmtDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  const km = (meters / 1000).toFixed(meters < 10000 ? 1 : 0);
  return `${km}km`;
}
