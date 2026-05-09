"use client";

import { useState } from "react";
import Link from "next/link";
import { Flag as FlagIcon, Plus, Search } from "lucide-react";
import { MOCK_USERS } from "@/lib/data/mock-users";
import { buildMockCollection } from "@/lib/data/stickers";
import { buildMatch, fmtDistance } from "@/lib/matches";
import { useCollection } from "@/hooks/useCollection";
import { useFavorites } from "@/hooks/useFavorites";
import { MatchArrows } from "@/components/match/MatchArrows";
import { AlbumProgress } from "@/components/match/AlbumProgress";

export default function FavoritosPage() {
  const { collection } = useCollection(247);
  const { favs, toggle, has } = useFavorites();
  const [query, setQuery] = useState("");

  const matches = MOCK_USERS.map((u, i) => {
    const m = buildMatch(collection, buildMockCollection(i + 1));
    const pctMap = buildMockCollection(i + 1);
    let owned = 0;
    pctMap.forEach((c) => c >= 1 && owned++);
    const pct = Math.round((owned / pctMap.size) * 1000) / 10;
    return { u, match: m, pct };
  });

  const favList = matches.filter(({ u }) => has(u.id));

  const searchMatches = query
    ? matches.filter(
        ({ u }) =>
          u.alias.toLowerCase().includes(query.toLowerCase()) ||
          u.id.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  return (
    <main className="px-5 pb-6 pt-14">
      <h1 className="font-display text-3xl tracking-tight">Favoritos</h1>
      <p className="mt-1 text-xs uppercase tracking-wider text-text-2">
        {favs.size} {favs.size === 1 ? "coleccionista marcado" : "coleccionistas marcados"}
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-md border border-line bg-white px-3.5">
        <Search size={16} strokeWidth={2} className="text-text-2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por alias o id (ej: maria_22)"
          className="h-10 flex-1 bg-transparent text-sm outline-none"
        />
      </div>

      {searchMatches.length > 0 && (
        <div className="mt-2 rounded-md border border-line bg-white">
          {searchMatches.map(({ u }) => {
            const active = has(u.id);
            return (
              <button
                key={u.id}
                onClick={() => toggle(u.id)}
                className="flex w-full items-center gap-3 border-b border-line p-3 text-left last:border-b-0"
              >
                <div className="grid h-9 w-9 place-items-center rounded-full bg-green-500 font-display text-sm text-white">
                  {u.alias.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{u.alias}</p>
                  <p className="text-xs text-text-2">{u.id}</p>
                </div>
                <Plus
                  size={18}
                  className={active ? "text-green-700" : "text-text-2"}
                  strokeWidth={2.2}
                />
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-5 space-y-2">
        {favList.length === 0 ? (
          <div className="grid h-48 place-items-center rounded-md border border-dashed border-line text-center text-sm text-text-2">
            Aún no tienes favoritos.<br />Búscalos arriba y márcalos con la bandera.
          </div>
        ) : (
          favList.map(({ u, match, pct }) => (
            <div
              key={u.id}
              className="flex items-center gap-3 rounded-md border border-line bg-white p-3"
            >
              <Link
                href={`/match/${u.id}`}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-green-500 font-display text-lg text-white"
              >
                {u.alias.slice(0, 2).toUpperCase()}
              </Link>
              <Link href={`/match/${u.id}`} className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold">{u.alias}</span>
                  {u.pro && (
                    <span className="rounded bg-gold/20 px-1 py-0.5 text-[9px] font-bold uppercase text-gold-dark">
                      Pro
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-text-2">
                  {fmtDistance(u.distM)} · ★{u.rating} · {u.trades} intercambios
                </div>
                <AlbumProgress pct={pct} className="mt-1.5" />
              </Link>
              <div className="flex flex-col items-end gap-1">
                <MatchArrows recibes={match.youGet.length} entregas={match.theyGet.length} size={16} />
                <button
                  onClick={() => toggle(u.id)}
                  className="grid h-7 w-7 place-items-center rounded-full bg-green-100 text-green-700"
                  aria-label="Quitar de favoritos"
                >
                  <FlagIcon size={14} strokeWidth={2.4} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
