"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cromio.favorites";

export function useFavorites() {
  const [favs, setFavs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setFavs(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  const persist = (next: Set<string>) => {
    setFavs(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    }
  };

  const toggle = useCallback(
    (id: string) => {
      const next = new Set(favs);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      persist(next);
    },
    [favs],
  );

  const has = useCallback((id: string) => favs.has(id), [favs]);

  return { favs, toggle, has };
}
