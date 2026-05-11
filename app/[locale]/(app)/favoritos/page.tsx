"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flag as FlagIcon, Search, X, MapPin } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { fmtDistance } from "@/lib/matches";
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
      const [profilesRes, nearbyRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, alias, display_name, color, rating, trades_count, plan")
          .in("id", ids),
        supabase.rpc("find_nearby_users", {
          p_user_id: user.id,
          p_radius_m: 50000,
        }),
      ]);
      if (cancelled) return;

      const nearby = new Map<
        string,
        { distance_m: number; you_get_count: number; they_get_count: number }
      >();
      for (const r of (nearbyRes.data ?? []) as Array<{
        user_id: string;
        distance_m: number;
        you_get: number[];
        they_get: number[];
      }>) {
        nearby.set(r.user_id, {
          distance_m: r.distance_m,
          you_get_count: r.you_get?.length ?? 0,
          they_get_count: r.they_get?.length ?? 0,
        });
      }

      setRows(
        (profilesRes.data ?? []).map((p) => {
          const n = nearby.get(p.id);
          return {
            id: p.id,
            alias: p.alias,
            display_name: p.display_name,
            color: p.color,
            rating: p.rating,
            trades_count: p.trades_count,
            plan: p.plan,
            distance_m: n?.distance_m ?? null,
            you_get_count: n?.you_get_count ?? 0,
            they_get_count: n?.they_get_count ?? 0,
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
      <h1 className="font-display text-3xl tracking-tight">Favoritos</h1>
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
                  <div
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-sm text-white"
                    style={{ background: u.color ?? "#26C6DA" }}
                  >
                    {u.alias.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{u.alias}</p>
                    {u.display_name && (
                      <p className="text-xs text-text-2">{u.display_name}</p>
                    )}
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
            <h2 className="mt-4 font-display text-xl">Aún no tienes favoritos</h2>
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
          rows.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 rounded-md border border-line bg-white p-3"
            >
              <Link
                href={`/match/${u.id}`}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-lg text-white"
                style={{ background: u.color ?? "#26C6DA" }}
              >
                {u.alias.slice(0, 2).toUpperCase()}
              </Link>
              <Link href={`/match/${u.id}`} className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold">{u.alias}</span>
                  {u.plan === "pro" && (
                    <span className="rounded bg-gold/20 px-1 py-0.5 text-[9px] font-bold uppercase text-gold-dark">
                      Pro
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-text-2">
                  {u.distance_m != null ? fmtDistance(u.distance_m) : "—"}
                  {u.rating != null && ` · ★${u.rating}`}
                  {u.trades_count != null && ` · ${u.trades_count} intercambios`}
                </div>
              </Link>
              <div className="flex flex-col items-end gap-1">
                <MatchArrows
                  recibes={u.you_get_count}
                  entregas={u.they_get_count}
                  size={16}
                />
                <button
                  onClick={() => toggle(u.id)}
                  className="grid h-7 w-7 place-items-center rounded-full bg-green-100 text-green-700"
                  aria-label="Quitar de favoritos"
                >
                  <FlagIcon size={14} strokeWidth={2.4} fill="currentColor" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
