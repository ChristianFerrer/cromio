"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildMockCollection, STICKERS, TOTAL_STICKERS } from "@/lib/data/stickers";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./useUser";

const STORAGE_KEY = "cromio.collection";

type Snapshot = Record<number, number>;

export function useCollection(mockSeed = 247) {
  const { user, loading: authLoading } = useUser();
  const [overrides, setOverrides] = useState<Snapshot>({});
  const [serverMap, setServerMap] = useState<Snapshot | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || user) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setOverrides(JSON.parse(raw));
    } catch {}
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined" || user) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  }, [overrides, user]);

  useEffect(() => {
    if (!user) {
      setServerMap(null);
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    supabase
      .from("user_stickers")
      .select("sticker_n, count")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const map: Snapshot = {};
        for (const row of data ?? []) {
          map[row.sticker_n] = row.count;
        }
        setServerMap(map);
      });
  }, [user]);

  const collection = useMemo(() => {
    const map = new Map<number, number>();
    if (user) {
      for (const s of STICKERS) {
        map.set(s.n, serverMap?.[s.n] ?? 0);
      }
    } else {
      const base = buildMockCollection(mockSeed);
      for (const s of STICKERS) {
        const baseCount = base.get(s.n) ?? 0;
        const delta = overrides[s.n] ?? 0;
        map.set(s.n, Math.max(0, baseCount + delta));
      }
    }
    return map;
  }, [user, serverMap, overrides, mockSeed]);

  const adjust = useCallback(
    (n: number, delta: number) => {
      if (user) {
        setServerMap((prev) => {
          const cur = prev?.[n] ?? 0;
          const next = Math.max(0, cur + delta);
          return { ...(prev ?? {}), [n]: next };
        });
        const supabase = createClient();
        if (!supabase) return;
        const cur = serverMap?.[n] ?? 0;
        const nextValue = Math.max(0, cur + delta);
        supabase
          .from("user_stickers")
          .upsert(
            { user_id: user.id, sticker_n: n, count: nextValue },
            { onConflict: "user_id,sticker_n" },
          )
          .then(({ error }) => {
            if (error) console.error("upsert failed", error);
          });
      } else {
        setOverrides((prev) => {
          const baseCount = buildMockCollection(mockSeed).get(n) ?? 0;
          const cur = prev[n] ?? 0;
          const next = Math.max(-baseCount, cur + delta);
          return { ...prev, [n]: next };
        });
      }
    },
    [user, serverMap, mockSeed],
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

  return {
    collection,
    stats,
    adjust,
    isAuthenticated: !!user,
    authLoading,
  };
}
