"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { STICKERS, TOTAL_STICKERS } from "@/lib/data/stickers";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./useUser";

type Snapshot = Record<number, number>;

const EMPTY_STATS = {
  owned: 0,
  total: TOTAL_STICKERS,
  missing: TOTAL_STICKERS,
  repes: 0,
  pct: 0,
};

export function useCollection() {
  const { user, loading: authLoading } = useUser();
  const [serverMap, setServerMap] = useState<Snapshot | null>(null);
  const [serverLoading, setServerLoading] = useState(false);

  useEffect(() => {
    if (authLoading || !user) {
      setServerMap(null);
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    setServerLoading(true);
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
        setServerLoading(false);
      });
  }, [authLoading, user]);

  const isInitializing = authLoading || (!!user && serverMap === null);

  const collection = useMemo(() => {
    const map = new Map<number, number>();
    for (const s of STICKERS) {
      map.set(s.n, isInitializing || !user ? 0 : serverMap?.[s.n] ?? 0);
    }
    return map;
  }, [isInitializing, user, serverMap]);

  const adjust = useCallback(
    (n: number, delta: number) => {
      if (isInitializing || !user) return;
      const cur = serverMap?.[n] ?? 0;
      const next = Math.max(0, cur + delta);
      setServerMap((prev) => ({ ...(prev ?? {}), [n]: next }));
      const supabase = createClient();
      if (!supabase) return;
      supabase
        .from("user_stickers")
        .upsert(
          { user_id: user.id, sticker_n: n, count: next },
          { onConflict: "user_id,sticker_n" },
        )
        .then(({ error }) => {
          if (error) console.error("[cromio] user_stickers upsert failed:", error);
        });
    },
    [isInitializing, user, serverMap],
  );

  const stats = useMemo(() => {
    if (isInitializing) return EMPTY_STATS;
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
  }, [isInitializing, collection]);

  return {
    collection,
    stats,
    adjust,
    isAuthenticated: !!user,
    isInitializing,
    serverLoading,
  };
}
