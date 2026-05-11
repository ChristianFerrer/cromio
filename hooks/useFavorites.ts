"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./useUser";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Cross-navigation cache of the current user's favourites. Same SWR
// pattern as useCollection: first mount fetches; subsequent mounts paint
// from cache and revalidate in the background.
const cachedByUser = new Map<string, Set<string>>();
const pendingByUser = new Map<string, Promise<Set<string>>>();
const subscribers = new Map<string, Set<(favs: Set<string>) => void>>();

function publish(userId: string, next: Set<string>) {
  cachedByUser.set(userId, next);
  const subs = subscribers.get(userId);
  if (subs) for (const fn of subs) fn(next);
}

async function fetchFavs(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  if (!supabase) return new Set();
  const { data } = await supabase
    .from("user_favorites")
    .select("favorite_user_id")
    .eq("user_id", userId);
  const set = new Set((data ?? []).map((r) => r.favorite_user_id));
  cachedByUser.set(userId, set);
  return set;
}

async function load(userId: string): Promise<Set<string>> {
  const cached = cachedByUser.get(userId);
  if (cached) {
    void fetchFavs(userId).then((fresh) => publish(userId, fresh));
    return cached;
  }
  let inflight = pendingByUser.get(userId);
  if (!inflight) {
    inflight = fetchFavs(userId);
    pendingByUser.set(userId, inflight);
    inflight.finally(() => pendingByUser.delete(userId));
  }
  return inflight;
}

export function useFavorites() {
  const { user, loading: authLoading } = useUser();
  const userId = user?.id;

  const [favs, setFavs] = useState<Set<string>>(() =>
    userId ? cachedByUser.get(userId) ?? new Set() : new Set(),
  );
  const [loaded, setLoaded] = useState<boolean>(() =>
    userId ? cachedByUser.has(userId) : false,
  );

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setFavs(new Set());
      setLoaded(true);
      return;
    }
    const c = cachedByUser.get(userId);
    if (c) {
      setFavs(c);
      setLoaded(true);
    }

    let cancelled = false;
    let subs = subscribers.get(userId);
    if (!subs) {
      subs = new Set();
      subscribers.set(userId, subs);
    }
    const sub = (s: Set<string>) => {
      if (!cancelled) setFavs(s);
    };
    subs.add(sub);

    load(userId).then((s) => {
      if (cancelled) return;
      setFavs(s);
      setLoaded(true);
    });

    return () => {
      cancelled = true;
      subs?.delete(sub);
    };
  }, [authLoading, userId]);

  // Realtime: keep favourites in sync across devices.
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    if (!supabase) return;
    const channel = supabase
      .channel(`user-favorites-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_favorites",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as { favorite_user_id?: string };
          const id = row.favorite_user_id;
          if (!id) return;
          const prev = cachedByUser.get(userId) ?? new Set<string>();
          const next = new Set(prev);
          if (payload.eventType === "DELETE") next.delete(id);
          else next.add(id);
          publish(userId, next);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const toggle = useCallback(
    async (id: string) => {
      if (!userId || !UUID_RE.test(id)) return;
      const supabase = createClient();
      if (!supabase) return;
      const willAdd = !favs.has(id);

      // Optimistic update — push through the publisher so any other
      // mounted hook instance picks it up too.
      const optimistic = new Set(favs);
      if (willAdd) optimistic.add(id);
      else optimistic.delete(id);
      publish(userId, optimistic);

      if (willAdd) {
        const { error } = await supabase
          .from("user_favorites")
          .insert({ user_id: userId, favorite_user_id: id });
        if (error && error.code !== "23505") {
          const rolled = new Set(optimistic);
          rolled.delete(id);
          publish(userId, rolled);
        }
      } else {
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", userId)
          .eq("favorite_user_id", id);
        if (error) {
          const rolled = new Set(optimistic);
          rolled.add(id);
          publish(userId, rolled);
        }
      }
    },
    [userId, favs],
  );

  const has = useCallback((id: string) => favs.has(id), [favs]);

  return { favs, toggle, has, loaded };
}
