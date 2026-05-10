"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, MapIcon, List, Lock } from "lucide-react";
import Link from "next/link";
import { useCollection } from "@/hooks/useCollection";
import { useNearbyUsers } from "@/hooks/useNearbyUsers";
import { fmtDistance } from "@/lib/matches";
import { MatchArrows } from "@/components/match/MatchArrows";
import { AlbumProgress } from "@/components/match/AlbumProgress";
import { StaticTileMap } from "@/components/map/StaticTileMap";

const RADII = [200, 500, 1000, 2000, 5000, 10000, 50000];
const FREE_MAX = 2000;

export default function MapaPage() {
  const { collection } = useCollection(247);
  const [radius, setRadius] = useState(1000);
  const [view, setView] = useState<"map" | "list">("map");
  const [listFilter, setListFilter] = useState<"all" | "match" | "lead">("all");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mapDims, setMapDims] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });

  const { users, center, isAuthenticated } = useNearbyUsers(radius, collection);

  const matches = useMemo(() => users.filter((u) => u.kind === "match"), [users]);
  const leads = useMemo(() => users.filter((u) => u.kind === "lead"), [users]);
  const counts = {
    all: users.length,
    match: matches.length,
    lead: leads.length,
  };

  useEffect(() => {
    if (view !== "map" || !containerRef.current) return;
    const el = containerRef.current;
    const update = () => {
      setMapDims({ w: el.clientWidth, h: el.clientHeight });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [view]);

  return (
    <main className="absolute inset-0 overflow-hidden">
      {view === "map" && (
        <div ref={containerRef} className="absolute inset-0 bg-[#F2EFE9]">
          {mapDims.w > 0 && mapDims.h > 0 && (
            <StaticTileMap
              centerLng={center[0]}
              centerLat={center[1]}
              users={users}
              width={mapDims.w}
              height={mapDims.h}
            />
          )}
        </div>
      )}

      <div className="absolute left-3 right-3 top-14 z-20 flex items-center gap-2">
        <div className="flex h-10 flex-1 items-center gap-2.5 rounded-md border border-black/5 bg-white/95 px-3.5 shadow-sh2 backdrop-blur">
          <Search size={16} strokeWidth={2} className="text-text-2" />
          <span className="text-sm font-medium">
            {isAuthenticated ? "Tu zona" : "Eixample, Barcelona"}
          </span>
        </div>
        <div className="flex h-10 gap-0.5 rounded-md border border-black/5 bg-white/95 p-0.5 shadow-sh2 backdrop-blur">
          {(["map", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`grid h-full w-10 place-items-center rounded-[10px] text-xs font-semibold transition-colors ${
                view === v ? "bg-ink text-white" : "bg-transparent text-text-2"
              }`}
            >
              {v === "map" ? <MapIcon size={14} strokeWidth={2} /> : <List size={14} strokeWidth={2} />}
            </button>
          ))}
        </div>
      </div>

      {view === "map" && radius === 200 && (
        <div className="absolute left-1/2 top-28 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-xs font-bold text-gold-light shadow-sh3 animate-slide-down">
          <span>🔥</span> Modo hiperlocal · Solo tu manzana
        </div>
      )}

      {view === "list" && (
        <div className="absolute inset-x-0 bottom-44 top-28 z-10 overflow-y-auto bg-bone px-4">
          <div className="sticky top-0 z-10 -mx-4 flex gap-1.5 bg-bone px-4 py-2.5">
            {(
              [
                { id: "all", label: "Todo", color: "var(--y-ink)" },
                { id: "match", label: "Matches", color: "var(--y-green-700)" },
                { id: "lead", label: "Te interesa", color: "#2D7DD8" },
              ] as const
            ).map((c) => {
              const active = listFilter === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setListFilter(c.id)}
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-semibold transition-colors"
                  style={{
                    background: active ? c.color : "var(--y-paper)",
                    color: active ? "#fff" : "var(--y-text)",
                  }}
                >
                  <span>{c.label}</span>
                  <span
                    className="rounded-md px-1.5 font-display text-[11px]"
                    style={{
                      background: active ? "rgba(255,255,255,.22)" : "rgba(0,0,0,.06)",
                      color: active ? "#fff" : "var(--y-text-2)",
                    }}
                  >
                    {counts[c.id]}
                  </span>
                </button>
              );
            })}
          </div>
          {listFilter !== "lead" && matches.length > 0 && (
            <>
              <h2 className="mb-2.5 mt-2 px-1 font-display text-lg text-ink">
                Matches{" "}
                <span className="text-sm text-green-700">· {matches.length}</span>
              </h2>
              {matches.map((u) => (
                <UserListRow key={u.id} u={u} />
              ))}
            </>
          )}
          {listFilter !== "match" && leads.length > 0 && (
            <>
              <h2 className="mb-2.5 mt-4 px-1 font-display text-lg text-ink">
                Te interesa{" "}
                <span className="text-sm text-match-interest">· {leads.length}</span>
              </h2>
              {leads.map((u) => (
                <UserListRow key={u.id} u={u} />
              ))}
            </>
          )}
          {users.length === 0 && (
            <p className="py-10 text-center text-sm text-text-2">
              Sin matches en este radio. Amplía el radio o añade más cromos.
            </p>
          )}
        </div>
      )}

      <div className="absolute bottom-24 left-3 right-3 z-20 rounded-xl border border-black/5 bg-white/95 p-3.5 shadow-sh3 backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-mute">
            Radio de búsqueda
          </span>
          <span className="font-display text-xl">
            {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}
          </span>
        </div>
        <div className="flex gap-1">
          {RADII.map((r) => {
            const locked = r > FREE_MAX;
            const active = r === radius;
            return (
              <button
                key={r}
                onClick={() => !locked && setRadius(r)}
                className={`flex h-7 flex-1 items-center justify-center gap-0.5 rounded text-[11px] font-semibold transition-colors ${
                  active
                    ? "bg-ink text-white"
                    : locked
                      ? "bg-paper text-mute"
                      : "bg-paper text-text"
                }`}
                disabled={locked}
              >
                {locked && <Lock size={10} className="text-gold" strokeWidth={2.4} />}
                {r >= 1000 ? `${r / 1000}km` : `${r}m`}
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function UserListRow({ u }: { u: ReturnType<typeof useNearbyUsers>["users"][number] }) {
  const isLead = u.kind === "lead";
  const avatarColor = isLead ? "#2D7DD8" : "#1FAE5A";
  return (
    <Link
      href={`/match/${u.id}`}
      className={`mb-2 flex items-center gap-3 rounded-md border bg-white p-3 ${
        isLead ? "border-match-interest/45" : "border-line"
      }`}
    >
      <div
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-lg text-white"
        style={{ background: avatarColor }}
      >
        {u.alias.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-text">{u.alias}</span>
          {isLead && (
            <span className="rounded bg-match-interest/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-match-interest">
              Te interesa
            </span>
          )}
        </div>
        <div className="mt-0.5 text-xs text-text-2">
          {fmtDistance(u.distance_m)} · ★{u.rating} · {u.trades_count} intercambios
        </div>
        <AlbumProgress pct={50} className="mt-1.5" />
      </div>
      <MatchArrows
        recibes={isLead ? 0 : u.you_get_count}
        entregas={isLead ? 0 : u.they_get_count}
        size={18}
      />
    </Link>
  );
}
