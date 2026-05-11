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

// Cross-navigation cache. Keyed by user id so a logout/login swap doesn't
// leak the previous user's collection. First mount per identity pays the
// fetch; every subsequent useCollection() call paints from cache and only
// refetches in the background to pick up out-of-band edits.
const cachedByUser = new Map<string, Snapshot>();
const pendingByUser = new Map<string, Promise<Snapshot>>();
const subscribers = new Map<string, Set<(s: Snapshot) => void>>();

function publish(userId: string, next: Snapshot) {
  cachedByUser.set(userId, next);
  const subs = subscribers.get(userId);
  if (subs) for (const fn of subs) fn(next);
}

async function fetchCollection(userId: string): Promise<Snapshot> {
  const supabase = createClient();
  if (!supabase) return {};
  const { data } = await supabase
    .from("user_stickers")
    .select("sticker_n, count")
    .eq("user_id", userId);
  const map: Snapshot = {};
  for (const row of data ?? []) map[row.sticker_n] = row.count;
  cachedByUser.set(userId, map);
  return map;
}

async function load(userId: string): Promise<Snapshot> {
  const cached = cachedByUser.get(userId);
  if (cached) {
    // Stale-while-revalidate: surface the cache instantly, refetch in
    // the background so the next render reflects any out-of-band edits
    // (e.g. an intercambio settled while the user was on another tab).
    void fetchCollection(userId).then((fresh) => publish(userId, fresh));
    return cached;
  }
  let inflight = pendingByUser.get(userId);
  if (!inflight) {
    inflight = fetchCollection(userId);
    pendingByUser.set(userId, inflight);
    inflight.finally(() => pendingByUser.delete(userId));
  }
  return inflight;
}

export function useCollection() {
  const { user, loading: authLoading } = useUser();
  const userId = user?.id;

  const [serverMap, setServerMap] = useState<Snapshot | null>(() =>
    userId ? cachedByUser.get(userId) ?? null : null,
  );

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setServerMap(null);
      return;
    }
    const c = cachedByUser.get(userId);
    if (c) setServerMap(c);

    let cancelled = false;
    let subs = subscribers.get(userId);
    if (!subs) {
      subs = new Set();
      subscribers.set(userId, subs);
    }
    const sub = (s: Snapshot) => {
      if (!cancelled) setServerMap(s);
    };
    subs.add(sub);

    load(userId).then((s) => {
      if (!cancelled) setServerMap(s);
    });

    return () => {
      cancelled = true;
      subs?.delete(sub);
    };
  }, [authLoading, userId]);

  const isInitializing = authLoading || (!!userId && serverMap === null);

  const collection = useMemo(() => {
    const map = new Map<number, number>();
    for (const s of STICKERS) {
      map.set(s.n, isInitializing || !userId ? 0 : serverMap?.[s.n] ?? 0);
    }
    return map;
  }, [isInitializing, userId, serverMap]);

  const adjust = useCallback(
    (n: number, delta: number) => {
      if (isInitializing || !userId) return;
      const cur = serverMap?.[n] ?? 0;
      const next = Math.max(0, cur + delta);
      const optimistic = { ...(serverMap ?? {}), [n]: next };
      publish(userId, optimistic);
      const supabase = createClient();
      if (!supabase) return;
      supabase
        .from("user_stickers")
        .upsert(
          { user_id: userId, sticker_n: n, count: next },
          { onConflict: "user_id,sticker_n" },
        )
        .then(({ error }) => {
          if (error) console.error("[cromio] user_stickers upsert failed:", error);
        });
    },
    [isInitializing, userId, serverMap],
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
    serverLoading: isInitializing,
  };
}
