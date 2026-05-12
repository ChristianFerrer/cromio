"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapIcon,
  List,
  Lock,
  RefreshCw,
  LocateFixed,
} from "lucide-react";
import Link from "next/link";
import { useNearbyUsers } from "@/hooks/useNearbyUsers";
import { useDeviceLocation } from "@/hooks/useDeviceLocation";
import { fmtDistance } from "@/lib/matches";
import { saveHomeLocation } from "@/lib/profile/actions";
import { CROMIO_COLORS } from "@/lib/design/colors";
import { MatchArrows } from "@/components/match/MatchArrows";
import { LeafletMap } from "@/components/map/LeafletMapClient";

const RADII = [200, 500, 1000, 2000, 5000, 10000, 50000];
const FREE_MAX = 2000;

function fmtRadius(r: number): string {
  return r >= 1000 ? `${r / 1000} km` : `${r} m`;
}

export default function MapaPage() {
  const [radius, setRadius] = useState(1000);
  const [view, setView] = useState<"map" | "list">("map");
  const [listFilter, setListFilter] = useState<"all" | "match" | "lead">("all");
  const [recenterToken, setRecenterToken] = useState(0);

  const {
    users,
    center: profileCenter,
    isAuthenticated,
    loading: usersLoading,
    refresh: refreshUsers,
  } = useNearbyUsers(radius);
  const device = useDeviceLocation(view === "map");

  const center: [number, number] = device.coords ?? profileCenter;

  const matches = useMemo(() => users.filter((u) => u.kind === "match"), [users]);
  const leads = useMemo(() => users.filter((u) => u.kind === "lead"), [users]);
  const counts = {
    all: users.length,
    match: matches.length,
    lead: leads.length,
  };

  const homeLocSavedRef = useRef<{ lng: number; lat: number } | null>(null);
  useEffect(() => {
    if (!isAuthenticated || !device.coords) return;
    const [lng, lat] = device.coords;
    const last = homeLocSavedRef.current;
    if (last) {
      const dLng = (lng - last.lng) * 111320 * Math.cos((lat * Math.PI) / 180);
      const dLat = (lat - last.lat) * 110540;
      const movedM = Math.sqrt(dLng * dLng + dLat * dLat);
      if (movedM < 50) return;
    }
    homeLocSavedRef.current = { lng, lat };
    void saveHomeLocation(lng, lat).then(() => {
      refreshUsers();
    });
  }, [isAuthenticated, device.coords, refreshUsers]);

  // Single status line at the top — when the list is empty we surface
  // it here ("Sin coleccionistas en 1 km") instead of with a separate
  // dismissible banner over the map. One source of truth for the
  // count, so it can never read twice on screen.
  const statusText = useMemo(() => {
    if (usersLoading) return "Buscando…";
    if (!isAuthenticated) return "";
    if (device.permissionDenied)
      return `Ubicación bloqueada · centramos en tu zona guardada`;
    if (users.length === 0)
      return `Sin coleccionistas en ${fmtRadius(radius)} — amplía el radio`;
    return `${users.length} ${users.length === 1 ? "coleccionista" : "coleccionistas"} en ${fmtRadius(radius)}`;
  }, [
    usersLoading,
    isAuthenticated,
    device.permissionDenied,
    users.length,
    radius,
  ]);

  return (
    <main className="absolute inset-0 flex flex-col bg-bone">
      <header className="z-30 px-5 pb-3 pt-14">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-display text-3xl tracking-tight">Radar</h1>
          <div className="flex items-center gap-2">
            <div className="flex h-9 gap-0.5 rounded-md border border-line bg-white p-0.5 shadow-sh1">
              {(["map", "list"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`grid h-full w-9 place-items-center rounded-[8px] text-xs font-semibold transition-colors ${
                    view === v ? "bg-ink text-white" : "bg-transparent text-text-2"
                  }`}
                  aria-label={v === "map" ? "Vista mapa" : "Vista lista"}
                  aria-pressed={view === v}
                >
                  {v === "map" ? (
                    <MapIcon size={14} strokeWidth={2} />
                  ) : (
                    <List size={14} strokeWidth={2} />
                  )}
                </button>
              ))}
            </div>
            {isAuthenticated && (
              <button
                onClick={refreshUsers}
                className="grid h-9 w-9 place-items-center rounded-md border border-line bg-white shadow-sh1"
                aria-label="Refrescar usuarios cercanos"
                disabled={usersLoading}
              >
                <RefreshCw
                  size={14}
                  strokeWidth={2}
                  className={
                    usersLoading ? "animate-spin text-green-700" : "text-text-2"
                  }
                />
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs uppercase tracking-wider text-text-2">
          {statusText}
        </p>

        <div className="mt-3 rounded-xl border border-black/5 bg-white p-3 shadow-sh1">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-mute">
              Radio
            </span>
            <span className="font-display text-base">
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
                  {locked && (
                    <Lock size={10} className="text-gold" strokeWidth={2.4} />
                  )}
                  {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden">
        {view === "map" && (
          <>
            <div className="absolute inset-0 z-0 bg-[#F2EFE9]">
              <LeafletMap
                centerLng={center[0]}
                centerLat={center[1]}
                zoom={13}
                users={users}
                radiusM={radius}
                recenterToken={recenterToken}
              />
            </div>
            <button
              onClick={() => setRecenterToken((t) => t + 1)}
              aria-label="Centrar en mi ubicación"
              className="absolute bottom-3 right-3 z-30 grid h-10 w-10 place-items-center rounded-md border border-black/5 bg-white/95 shadow-sh2 backdrop-blur"
            >
              <LocateFixed size={14} strokeWidth={2} className="text-text-2" />
            </button>
            {radius === 200 && (
              <div className="pointer-events-none absolute left-1/2 top-3 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-xs font-bold text-gold-light shadow-sh3">
                <span>🔥</span> Modo hiperlocal · Solo tu manzana
              </div>
            )}
          </>
        )}

        {view === "list" && (
          <div className="absolute inset-0 overflow-y-auto px-4 pb-4 pt-2">
            <div className="sticky top-0 z-10 -mx-4 flex gap-1.5 bg-bone px-4 py-2.5">
              {(
                [
                  { id: "all", label: "Todo", color: "var(--y-ink)" },
                  { id: "match", label: "Matches", color: "#089258" },
                  {
                    id: "lead",
                    label: "Te interesa",
                    color: CROMIO_COLORS.match.interest,
                  },
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
                        background: active
                          ? "rgba(255,255,255,.22)"
                          : "rgba(0,0,0,.06)",
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
                  <span className="text-sm" style={{ color: "#089258" }}>
                    · {matches.length}
                  </span>
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
                  <span className="text-sm text-match-interest">
                    · {leads.length}
                  </span>
                </h2>
                {leads.map((u) => (
                  <UserListRow key={u.id} u={u} />
                ))}
              </>
            )}
            {usersLoading && users.length === 0 ? (
              <div className="mt-2 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
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
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="mt-4 flex flex-col items-center rounded-2xl border border-line bg-gradient-to-b from-paper to-bone px-6 py-10 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-700">
                  <List size={22} strokeWidth={2.2} />
                </div>
                <h2 className="mt-3 font-display text-lg">
                  Amplía el radio
                </h2>
                <p className="mt-1 max-w-xs text-xs leading-snug text-text-2">
                  No hay coleccionistas en {fmtRadius(radius)}. Aumenta el rango
                  con los chips de arriba o añade más cromos a tu álbum para
                  abrir el rango de matches.
                </p>
                <Link
                  href="/album"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-green-500 px-4 py-2.5 text-xs font-bold text-white shadow-sh1"
                >
                  Añadir cromos
                </Link>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}

function UserListRow({
  u,
}: {
  u: ReturnType<typeof useNearbyUsers>["users"][number];
}) {
  const isLead = u.kind === "lead";
  const avatarColor = isLead ? CROMIO_COLORS.match.interest : "#10C56A";
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
          {fmtDistance(u.distance_m)} · {u.trades_count} intercambios
        </div>
      </div>
      <MatchArrows
        recibes={isLead ? 0 : u.you_get_count}
        entregas={isLead ? 0 : u.they_get_count}
        size={18}
      />
    </Link>
  );
}
