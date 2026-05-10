"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./useUser";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useFavorites() {
  const { user } = useUser();
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  // Load from Supabase
  useEffect(() => {
    if (!user) {
      setFavs(new Set());
      setLoaded(true);
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    supabase
      .from("user_favorites")
      .select("favorite_user_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (cancelled) return;
        setFavs(new Set((data ?? []).map((r) => r.favorite_user_id)));
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Realtime: keep favorites in sync across devices
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    if (!supabase) return;
    const channel = supabase
      .channel(`user-favorites-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_favorites",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setFavs((prev) => {
            const next = new Set(prev);
            const row = (payload.new ?? payload.old) as { favorite_user_id?: string };
            const id = row.favorite_user_id;
            if (!id) return prev;
            if (payload.eventType === "DELETE") next.delete(id);
            else next.add(id);
            return next;
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const toggle = useCallback(
    async (id: string) => {
      if (!user || !UUID_RE.test(id)) return;
      const supabase = createClient();
      if (!supabase) return;
      const willAdd = !favs.has(id);

      // Optimistic update
      setFavs((prev) => {
        const next = new Set(prev);
        if (willAdd) next.add(id);
        else next.delete(id);
        return next;
      });

      if (willAdd) {
        const { error } = await supabase
          .from("user_favorites")
          .insert({ user_id: user.id, favorite_user_id: id });
        if (error) {
          // Rollback on hard error (ignore duplicate key, the row already exists)
          if (error.code !== "23505") {
            setFavs((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }
        }
      } else {
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("favorite_user_id", id);
        if (error) {
          setFavs((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
          });
        }
      }
    },
    [user, favs],
  );

  const has = useCallback((id: string) => favs.has(id), [favs]);

  return { favs, toggle, has, loaded };
}
