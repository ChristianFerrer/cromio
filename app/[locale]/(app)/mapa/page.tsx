"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap, type Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Search, MapIcon, List, Lock } from "lucide-react";
import Link from "next/link";
import { MOCK_USERS } from "@/lib/data/mock-users";
import { buildMockCollection } from "@/lib/data/stickers";
import { buildMatch, fmtDistance } from "@/lib/matches";
import { useCollection } from "@/hooks/useCollection";
import { Chip } from "@/components/ui/Chip";
import { MatchArrows } from "@/components/match/MatchArrows";
import { AlbumProgress } from "@/components/match/AlbumProgress";

const BARCELONA_EIXAMPLE: [number, number] = [2.1645, 41.3917];
const RADII = [200, 500, 1000, 2000, 5000, 10000, 50000];
const FREE_MAX = 2000;

function metersToLngLatOffset(
  center: [number, number],
  pos: { x: number; y: number },
  radiusM: number,
): [number, number] {
  const angle = ((pos.x + pos.y) * Math.PI * 2) / 100;
  const distM = (radiusM * (40 + ((pos.x * pos.y) % 50))) / 100;
  const dLng = (Math.cos(angle) * distM) / (111_320 * Math.cos((center[1] * Math.PI) / 180));
  const dLat = (Math.sin(angle) * distM) / 110_540;
  return [center[0] + dLng, center[1] + dLat];
}

export default function MapaPage() {
  const { collection } = useCollection(247);
  const [radius, setRadius] = useState(1000);
  const [view, setView] = useState<"map" | "list">("map");
  const [listFilter, setListFilter] = useState<"all" | "match" | "lead">("all");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);

  const userEntries = useMemo(() => {
    return MOCK_USERS.map((u) => {
      const m = buildMatch(collection, buildMockCollection(MOCK_USERS.indexOf(u) + 1));
      const kind: "match" | "lead" | null =
        m.youGet.length > 0 && m.theyGet.length > 0
          ? "match"
          : m.youGet.length > 0
            ? "lead"
            : null;
      return { u, match: m, kind };
    })
      .filter((e) => e.kind && e.u.distM <= radius)
      .sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === "match" ? -1 : 1;
        return (
          (b.match.youGet.length + b.match.theyGet.length) -
          (a.match.youGet.length + a.match.theyGet.length)
        );
      });
  }, [collection, radius]);

  useEffect(() => {
    if (view !== "map" || !containerRef.current || mapRef.current) return;
    const styleUrl =
      process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/positron";
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: BARCELONA_EIXAMPLE,
      zoom: 14,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [view]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || view !== "map") return;

    const setMarkers = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const userPin = document.createElement("div");
      userPin.className =
        "h-4 w-4 rounded-full bg-green-500 border-[3px] border-white shadow-md";
      const userMarker = new maplibregl.Marker({ element: userPin })
        .setLngLat(BARCELONA_EIXAMPLE)
        .addTo(map);
      markersRef.current.push(userMarker);

      userEntries.forEach((entry) => {
        const lngLat = metersToLngLatOffset(BARCELONA_EIXAMPLE, entry.u.position, radius);
        const el = document.createElement("a");
        el.href = `/match/${entry.u.id}`;
        const color = entry.kind === "match" ? "#1FAE5A" : "#2D7DD8";
        el.style.cursor = "pointer";
        el.innerHTML = `
          <div style="position:relative;transform:translate(-50%,-100%);">
            <div style="
              width:46px;height:46px;border-radius:50% 50% 50% 0;
              background:${color};transform:rotate(-45deg);
              border:3px solid #fff;box-shadow:0 6px 14px rgba(0,0,0,.22);
              display:flex;align-items:center;justify-content:center;
            ">
              <span style="
                transform:rotate(45deg);color:#fff;
                font-family:var(--font-bebas),system-ui;font-size:18px;
              ">${entry.u.alias.slice(0, 2).toUpperCase()}</span>
            </div>
            <div style="
              position:absolute;top:-8px;left:50%;transform:translateX(-50%);
              background:#fff;border-radius:10px;padding:2px 6px;
              box-shadow:0 2px 6px rgba(0,0,0,.18);
              font-family:var(--font-bebas),system-ui;font-size:11px;
              display:flex;gap:3px;white-space:nowrap;
            ">
              <span style="color:#117C4E">▼${entry.match.youGet.length}</span>
              <span style="color:#D7263D">▲${entry.match.theyGet.length}</span>
            </div>
          </div>
        `;
        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat(lngLat)
          .addTo(map);
        markersRef.current.push(marker);
      });
    };

    if (map.loaded()) setMarkers();
    else map.once("load", setMarkers);
  }, [userEntries, radius, view]);

  const matches = userEntries.filter((e) => e.kind === "match");
  const leads = userEntries.filter((e) => e.kind === "lead");
  const counts = {
    all: userEntries.length,
    match: matches.length,
    lead: leads.length,
  };

  return (
    <main className="absolute inset-0 overflow-hidden">
      {view === "map" && (
        <>
          <div ref={containerRef} className="absolute inset-0" />
          <RadarOverlay />
        </>
      )}

      <div className="absolute left-3 right-3 top-14 z-20 flex items-center gap-2">
        <div className="flex h-10 flex-1 items-center gap-2.5 rounded-md border border-black/5 bg-white/95 px-3.5 shadow-sh2 backdrop-blur">
          <Search size={16} strokeWidth={2} className="text-text-2" />
          <span className="text-sm font-medium">Eixample, Barcelona</span>
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
                Matches <span className="text-sm text-green-700">· {matches.length}</span>
              </h2>
              {matches.map((e) => (
                <UserListRow key={e.u.id} entry={e} />
              ))}
            </>
          )}
          {listFilter !== "match" && leads.length > 0 && (
            <>
              <h2 className="mb-2.5 mt-4 px-1 font-display text-lg text-ink">
                Te interesa <span className="text-sm text-match-interest">· {leads.length}</span>
              </h2>
              {leads.map((e) => (
                <UserListRow key={e.u.id} entry={e} />
              ))}
            </>
          )}
          {userEntries.length === 0 && (
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

function RadarOverlay() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
      <div className="relative" style={{ width: 380, height: 380 }}>
        <div
          className="absolute inset-0 rounded-full border-2 border-dashed"
          style={{
            borderColor: "rgba(31,174,90,.55)",
            background:
              "radial-gradient(circle, rgba(31,174,90,.14), rgba(31,174,90,.06) 60%, transparent 75%)",
          }}
        />
        <div
          className="absolute inset-0 animate-radar-pulse rounded-full border-2"
          style={{ borderColor: "rgba(31,174,90,.6)" }}
        />
        <div
          className="absolute inset-0 animate-radar-pulse rounded-full border-2"
          style={{ borderColor: "rgba(31,174,90,.5)", animationDelay: "1.3s" }}
        />
      </div>
    </div>
  );
}

function UserListRow({
  entry,
}: {
  entry: ReturnType<typeof buildMatch> extends infer _ ? {
    u: (typeof MOCK_USERS)[number];
    match: ReturnType<typeof buildMatch>;
    kind: "match" | "lead" | null;
  } : never;
}) {
  const { u, match, kind } = entry;
  const isLead = kind === "lead";
  const avatarColor = isLead ? "#2D7DD8" : "#1FAE5A";
  const pct = (() => {
    const map = buildMockCollection(MOCK_USERS.indexOf(u) + 1);
    let owned = 0;
    map.forEach((c) => c >= 1 && owned++);
    return Math.round((owned / map.size) * 1000) / 10;
  })();
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
          {u.pro && (
            <span className="rounded bg-gold/20 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold-dark">
              Pro
            </span>
          )}
          {isLead && (
            <span className="rounded bg-match-interest/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-match-interest">
              Te interesa
            </span>
          )}
        </div>
        <div className="mt-0.5 text-xs text-text-2">
          {fmtDistance(u.distM)} · ★{u.rating} · {u.trades} intercambios
        </div>
        <AlbumProgress pct={pct} className="mt-1.5" />
      </div>
      <MatchArrows
        recibes={isLead ? 0 : match.youGet.length}
        entregas={isLead ? 0 : match.theyGet.length}
        size={18}
      />
    </Link>
  );
}
