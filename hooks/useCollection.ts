"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildMockCollection, STICKERS, TOTAL_STICKERS } from "@/lib/data/stickers";

const STORAGE_KEY = "cromio.collection";

type Snapshot = Record<number, number>;

export function useCollection(seed = 247) {
  const [overrides, setOverrides] = useState<Snapshot>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setOverrides(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  }, [overrides]);

  const base = useMemo(() => buildMockCollection(seed), [seed]);

  const collection = useMemo(() => {
    const map = new Map<number, number>();
    for (const s of STICKERS) {
      const baseCount = base.get(s.n) ?? 0;
      const delta = overrides[s.n] ?? 0;
      map.set(s.n, Math.max(0, baseCount + delta));
    }
    return map;
  }, [base, overrides]);

  const adjust = useCallback(
    (n: number, delta: number) => {
      setOverrides((prev) => {
        const baseCount = base.get(n) ?? 0;
        const cur = prev[n] ?? 0;
        const next = Math.max(-baseCount, cur + delta);
        return { ...prev, [n]: next };
      });
    },
    [base],
  );

  const stats = useMemo(() => {
    let owned = 0;
    let repes = 0;
    collection.forEach((count) => {
      if (count >= 1) owned++;
      if (count >= 2) repes += count - 1;
    });
    return {
      owned,
      total: TOTAL_STICKERS,
      missing: TOTAL_STICKERS - owned,
      repes,
      pct: (owned / TOTAL_STICKERS) * 100,
    };
  }, [collection]);

  return { collection, stats, adjust };
}
