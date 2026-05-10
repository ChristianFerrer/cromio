"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./useUser";
import { MOCK_USERS } from "@/lib/data/mock-users";
import { buildMockCollection } from "@/lib/data/stickers";
import { buildMatch } from "@/lib/matches";

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
  is_demo?: boolean;
};

function bearingFromString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return ((Math.abs(hash) % 360) + 360) % 360;
}

function buildMockNearby(
  radiusM: number,
  collection: Map<number, number>,
  isDemo: boolean,
): NearbyUser[] {
  const out: NearbyUser[] = [];
  for (const m of MOCK_USERS) {
    if (m.distM > radiusM) continue;
    const idx = MOCK_USERS.indexOf(m) + 1;
    const match = buildMatch(collection, buildMockCollection(idx));
    const kind: "match" | "lead" | null =
      match.youGet.length > 0 && match.theyGet.length > 0
        ? "match"
        : match.youGet.length > 0
          ? "lead"
          : null;
    if (!kind) continue;
    out.push({
      id: m.id,
      alias: m.alias,
      display_name: null,
      avatar_url: null,
      color: m.color,
      rating: m.rating,
      trades_count: m.trades,
      distance_m: m.distM,
      bearing_deg: bearingFromString(m.id),
      you_get_count: match.youGet.length,
      they_get_count: match.theyGet.length,
      kind,
      is_demo: isDemo,
    });
  }
  return out;
}

export function useNearbyUsers(
  radiusM: number,
  collection: Map<number, number>,
) {
  const { user, loading: authLoading } = useUser();
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [center, setCenter] = useState<[number, number]>(BARCELONA_EIXAMPLE);
  const [loading, setLoading] = useState(false);
  const [isDemoFallback, setIsDemoFallback] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setUsers(buildMockNearby(radiusM, collection, false));
      setCenter(BARCELONA_EIXAMPLE);
      setLoading(false);
      setIsDemoFallback(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) return;
    setLoading(true);

    Promise.all([
      supabase.rpc("get_my_location"),
      supabase.rpc("find_nearby_users", {
        p_user_id: user.id,
        p_radius_m: radiusM,
      }),
    ]).then(([locResult, usersResult]) => {
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

      if (rows.length === 0) {
        setUsers(buildMockNearby(radiusM, collection, true));
        setIsDemoFallback(true);
      } else {
        setUsers(
          rows.map((r) => ({
            id: r.user_id,
            alias: r.alias,
            display_name: r.display_name,
            avatar_url: r.avatar_url,
            color: r.color ?? "#1FAE5A",
            rating: r.rating,
            trades_count: r.trades_count,
            distance_m: r.distance_m,
            bearing_deg: r.bearing_deg,
            you_get_count: r.you_get?.length ?? 0,
            they_get_count: r.they_get?.length ?? 0,
            kind: r.kind,
            is_demo: false,
          })),
        );
        setIsDemoFallback(false);
      }
      setLoading(false);
    });
  }, [user, authLoading, radiusM, collection]);

  return {
    users,
    center,
    loading,
    isAuthenticated: !!user,
    isDemoFallback,
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
