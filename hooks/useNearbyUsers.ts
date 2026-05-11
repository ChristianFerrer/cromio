"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./useUser";

const BARCELONA_EIXAMPLE: [number, number] = [2.1645, 41.3917];

export type NearbyUser = {
  id: string;
  alias: string;
  display_name: string | null;
  avatar_url: string | null;
  color: string;
  rating: number;
  trades_count: number;
  distance_m: number;
  bearing_deg: number;
  you_get_count: number;
  they_get_count: number;
  kind: "match" | "lead";
};

export function useNearbyUsers(radiusM: number) {
  const { user, loading: authLoading } = useUser();
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [center, setCenter] = useState<[number, number]>(BARCELONA_EIXAMPLE);
  // Start `loading=true` so consumers can show their skeleton on the very
  // first paint and never flash an empty state before the first fetch
  // resolves. We flip it to false only once a fetch completes (or auth
  // is known to be missing).
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    // While auth is still resolving, keep loading=true so consumers
    // don't paint an empty state in the gap. Only flip to false when
    // we positively know there is no user.
    if (authLoading) return;
    if (!user) {
      setUsers([]);
      setCenter(BARCELONA_EIXAMPLE);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) return;
    setLoading(true);
    let cancelled = false;

    Promise.all([
      supabase.rpc("get_my_location"),
      supabase.rpc("find_nearby_users", {
        p_user_id: user.id,
        p_radius_m: radiusM,
      }),
    ]).then(([locResult, usersResult]) => {
      if (cancelled) return;

      const locRow = locResult.data?.[0];
      if (locRow?.lng != null && locRow?.lat != null) {
        setCenter([locRow.lng, locRow.lat]);
      }
      const rows = (usersResult.data ?? []) as Array<{
        user_id: string;
        alias: string;
        display_name: string | null;
        avatar_url: string | null;
        color: string | null;
        rating: number;
        trades_count: number;
        distance_m: number;
        bearing_deg: number;
        you_get: number[];
        they_get: number[];
        kind: "match" | "lead";
      }>;

      setUsers(
        rows.map((r) => ({
          id: r.user_id,
          alias: r.alias,
          display_name: r.display_name,
          avatar_url: r.avatar_url,
          color: r.color ?? "#26C6DA",
          rating: r.rating,
          trades_count: r.trades_count,
          distance_m: r.distance_m,
          bearing_deg: r.bearing_deg,
          you_get_count: r.you_get?.length ?? 0,
          they_get_count: r.they_get?.length ?? 0,
          kind: r.kind,
        })),
      );
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, radiusM, refreshKey]);

  useEffect(() => {
    if (!user) return;
    const id = window.setInterval(refresh, 30000);
    return () => window.clearInterval(id);
  }, [user, refresh]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    if (!supabase) return;

    const debouncedRefresh = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(refresh, 600);
    };

    const channel = supabase
      .channel("nearby-users-watch")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_stickers" },
        debouncedRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        debouncedRefresh,
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  return {
    users,
    center,
    loading,
    isAuthenticated: !!user,
    refresh,
  };
}

export function lngLatFromBearing(
  center: [number, number],
  bearingDeg: number,
  distM: number,
): [number, number] {
  const rad = (bearingDeg * Math.PI) / 180;
  const dLng =
    (Math.cos(rad) * distM) /
    (111320 * Math.cos((center[1] * Math.PI) / 180));
  const dLat = (Math.sin(rad) * distM) / 110540;
  return [center[0] + dLng, center[1] + dLat];
}
