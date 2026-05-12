"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flag as FlagIcon, Search, X, MapPin } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { fmtDistance } from "@/lib/matches";
import { TOTAL_STICKERS } from "@/lib/data/stickers";
import { MatchArrows } from "@/components/match/MatchArrows";

type FavRow = {
  id: string;
  alias: string;
  display_name: string | null;
  color: string | null;
  rating: number | null;
  trades_count: number | null;
  plan: string | null;
  distance_m: number | null;
  you_get_count: number;
  they_get_count: number;
  owned: number;
  missing: number;
  repes: number;
  pct: number;
};

export default function FavoritosPage() {
  const { favs, toggle, has, loaded } = useFavorites();
  const { user } = useUser();
  const [rows, setRows] = useState<FavRow[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FavRow[]>([]);
  // Start in `loading` so the very first paint is the skeleton, not the
  // "Aún no tienes favoritos" empty state. Otherwise navigating into the
  // page flashes the empty card for ~1s while the favourites hook hydrates.
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!user || !loaded) return;
    if (favs.size === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    if (!supabase) return;

    setLoading(true);
    let cancelled = false;
    (async () => {
      const ids = [...favs];
      // We deliberately compute the match counts pairwise here instead
      // of reading them from `find_nearby_users`. That RPC only returns
      // users inside its radius (50 km below), so a contact farther
      // away (or without home_location) silently fell back to 0/0 and
      // disagreed with /match/<id>, which always works off the raw
      // user_stickers rows. The RPC stays in the fan-out for the
      // distance field, which IS proximity-dependent by design.
      const [profilesRes, nearbyRes, stickersRes, myStickersRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, alias, display_name, color, rating, trades_count, plan")
          .in("id", ids),
        supabase.rpc("find_nearby_users", {
          p_user_id: user.id,
          p_radius_m: 50000,
        }),
        supabase
          .from("user_stickers")
          .select("user_id, sticker_n, count")
          .in("user_id", ids),
        supabase
          .from("user_stickers")
          .select("sticker_n, count")
          .eq("user_id", user.id),
      ]);
      if (cancelled) return;

      const distanceByUser = new Map<string, number>();
      for (const r of (nearbyRes.data ?? []) as Array<{
        user_id: string;
        distance_m: number;
      }>) {
        distanceByUser.set(r.user_id, r.distance_m);
      }

      const myCol = new Map<number, number>();
      for (const s of (myStickersRes.data ?? []) as Array<{
        sticker_n: number;
        count: number;
      }>) {
        myCol.set(s.sticker_n, s.count);
      }

      const colByUser = new Map<string, Map<number, number>>();
      const statsByUser = new Map<string, { owned: number; repes: number }>();
      for (const s of (stickersRes.data ?? []) as Array<{
        user_id: string;
        sticker_n: number;
        count: number;
      }>) {
        let m = colByUser.get(s.user_id);
        if (!m) {
          m = new Map();
          colByUser.set(s.user_id, m);
        }
        m.set(s.sticker_n, s.count);

        const cur = statsByUser.get(s.user_id) ?? { owned: 0, repes: 0 };
        if (s.count >= 1) cur.owned++;
        if (s.count >= 2) cur.repes += s.count - 1;
        statsByUser.set(s.user_id, cur);
      }

      setRows(
        (profilesRes.data ?? []).map((p) => {
          const s = statsByUser.get(p.id) ?? { owned: 0, repes: 0 };
          const theirCol = colByUser.get(p.id) ?? new Map<number, number>();
          let youGet = 0;
          let theyGet = 0;
          for (let i = 1; i <= TOTAL_STICKERS; i++) {
            const mine = myCol.get(i) ?? 0;
            const theirs = theirCol.get(i) ?? 0;
            if (mine === 0 && theirs >= 2) youGet++;
            if (mine >= 2 && theirs === 0) theyGet++;
          }
          return {
            id: p.id,
            alias: p.alias,
            display_name: p.display_name,
            color: p.color,
            rating: p.rating,
            trades_count: p.trades_count,
            plan: p.plan,
            distance_m: distanceByUser.get(p.id) ?? null,
            you_get_count: youGet,
            they_get_count: theyGet,
            owned: s.owned,
            missing: TOTAL_STICKERS - s.owned,
            repes: s.repes,
            pct: TOTAL_STICKERS > 0 ? (s.owned / TOTAL_STICKERS) * 100 : 0,
          };
        }),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, favs, loaded]);

  // Search profiles by alias OR display_name
  useEffect(() => {
    const trimmed = query.trim();
    if (!user || trimmed.length === 0) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    const supabase = createClient();
    if (!supabase) return;

    setSearching(true);
    let cancelled = false;
    // Escape % and _ so a literal % typed by the user doesn't expand
    // into a wildcard. Postgres uses \ as the escape char by default.
    const escaped = trimmed.replace(/[\\%_]/g, (c) => `\\${c}`);
    const t = setTimeout(async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, alias, display_name, color, rating, trades_count, plan")
        .or(`alias.ilike.%${escaped}%,display_name.ilike.%${escaped}%`)
        .neq("id", user.id)
        .limit(15);
      if (cancelled) return;
      if (error) {
        console.error("[cromio] favorites search failed:", error);
      }
      setSearchResults(
        (data ?? []).map((p) => ({
          id: p.id,
          alias: p.alias,
          display_name: p.display_name,
          color: p.color,
          rating: p.rating,
          trades_count: p.trades_count,
          plan: p.plan,
          distance_m: null,
          you_get_count: 0,
          they_get_count: 0,
          owned: 0,
          missing: TOTAL_STICKERS,
          repes: 0,
          pct: 0,
        })),
      );
      setSearching(false);
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, user]);

  return (
    <main className="px-5 pb-6 pt-14">
      <h1 className="font-display text-3xl tracking-tight">Contactos</h1>
      <p className="mt-1 text-xs uppercase tracking-wider text-text-2">
        {favs.size} {favs.size === 1 ? "coleccionista" : "coleccionistas"}
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-md border border-line bg-white px-3.5">
        <Search size={16} strokeWidth={2} className="text-text-2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar coleccionista por alias"
          className="h-10 flex-1 bg-transparent text-sm outline-none"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Limpiar">
            <X size={14} className="text-text-2" />
          </button>
        )}
      </div>

      {query.trim().length > 0 && (() => {
        const visible = searchResults.filter((u) => !has(u.id));
        return (
          <div className="mt-2 rounded-md border border-line bg-white">
            {searching ? (
              <p className="px-3 py-3 text-xs text-text-2">Buscando…</p>
            ) : visible.length === 0 ? (
              <p className="px-3 py-3 text-xs text-text-2">
                {searchResults.length === 0
                  ? `Sin resultados para «${query.trim()}»`
                  : "Todos los resultados ya están en tus favoritos"}
              </p>
            ) : (
              visible.map((u) => (
                <button
                  key={u.id}
                  onClick={() => toggle(u.id)}
                  className="flex w-full items-center gap-3 border-b border-line p-3 text-left last:border-b-0"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-green-500 font-display text-sm text-white">
                    {(u.display_name ?? u.alias).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{u.display_name ?? u.alias}</p>
                  </div>
                  <FlagIcon
                    size={18}
                    className="text-text-2"
                    strokeWidth={2.2}
                  />
                </button>
              ))
            )}
          </div>
        );
      })()}

      <div className="mt-5 space-y-2">
        {!loaded || (loading && rows.length === 0) ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-md border border-line bg-white p-3"
            >
              <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-paper" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-paper" />
                <div className="h-3 w-40 animate-pulse rounded bg-paper" />
              </div>
            </div>
          ))
        ) : rows.length === 0 ? (
          <div className="mt-2 flex flex-col items-center rounded-2xl border border-line bg-gradient-to-b from-paper to-bone px-6 py-10 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-green-500 to-green-700 text-white shadow-sh2">
              <FlagIcon size={26} strokeWidth={2} fill="currentColor" />
            </div>
            <h2 className="mt-4 font-display text-xl">Aún no tienes contactos</h2>
            <p className="mt-1 max-w-xs text-xs leading-snug text-text-2">
              Marca con la bandera a los coleccionistas que te interesen para tenerlos siempre a un toque, aunque cambien de zona.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/mapa"
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-green-500 px-4 py-2.5 text-xs font-bold text-white shadow-sh1"
              >
                <MapPin size={14} strokeWidth={2.2} />
                Buscar en el mapa
              </Link>
              <button
                type="button"
                onClick={() => {
                  const el = document.querySelector<HTMLInputElement>(
                    'input[placeholder="Buscar coleccionista por alias"]',
                  );
                  el?.focus();
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-line bg-white px-4 py-2.5 text-xs font-semibold"
              >
                <Search size={14} strokeWidth={2.2} />
                Buscar por alias
              </button>
            </div>
          </div>
        ) : (
          rows.map((u) => {
            const visibleName = u.display_name ?? u.alias;
            return (
              <div
                key={u.id}
                className="flex items-start gap-3 rounded-md border border-line bg-white p-3"
              >
                <Link
                  href={`/match/${u.id}`}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-green-500 font-display text-lg text-white"
                >
                  {visibleName.slice(0, 2).toUpperCase()}
                </Link>
                <Link href={`/match/${u.id}`} className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold">{visibleName}</span>
                      {u.plan === "pro" && (
                        <span className="rounded bg-gold/20 px-1 py-0.5 text-[9px] font-bold uppercase text-gold-dark">
                          Pro
                        </span>
                      )}
                    </div>
                    <MatchArrows
                      recibes={u.you_get_count}
                      entregas={u.they_get_count}
                      size={14}
                    />
                  </div>
                  <div className="mt-0.5 text-xs text-text-2">
                    {[
                      u.distance_m != null ? fmtDistance(u.distance_m) : null,
                      u.trades_count != null
                        ? `${u.trades_count} intercambios`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Coleccionista"}
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-2 text-[11px] text-text-2">
                    <span>
                      <b className="text-text">{u.owned}</b>
                      <span className="text-mute">/{TOTAL_STICKERS}</span>
                    </span>
                    <span className="font-display tabular text-green-700">
                      {u.pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-700 to-green-500"
                      style={{ width: `${u.pct}%` }}
                    />
                  </div>
                  <div className="mt-1 flex gap-3 text-[11px] text-text-2">
                    <span>
                      <b className="text-text">{u.repes}</b> repes
                    </span>
                    <span>
                      <b className="text-text">{u.missing}</b> faltan
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => toggle(u.id)}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-green-100 text-green-700"
                  aria-label="Quitar de contactos"
                >
                  <FlagIcon size={14} strokeWidth={2.4} fill="currentColor" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
