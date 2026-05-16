"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapIcon,
  List,
  Lock,
  RefreshCw,
  LocateFixed,
  ChevronDown,
  X,
} from "lucide-react";
import Link from "next/link";
import { useNearbyUsers } from "@/hooks/useNearbyUsers";
import { useDeviceLocation } from "@/hooks/useDeviceLocation";
import { fmtDistance } from "@/lib/matches";
import { saveHomeLocation } from "@/lib/profile/actions";
import { CROMIO_COLORS } from "@/lib/design/colors";
import { MatchArrows } from "@/components/match/MatchArrows";
import { LeafletMap } from "@/components/map/LeafletMapClient";
import { PageHeader } from "@/components/PageHeader";

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
  const [radiusOpen, setRadiusOpen] = useState(false);
  const [emptyBannerDismissed, setEmptyBannerDismissed] = useState(false);
  // Re-show the empty banner whenever the radius changes — the message
  // depends on radius so dismissing for 200m shouldn't hide it for 5km.
  useEffect(() => {
    setEmptyBannerDismissed(false);
  }, [radius]);
  const radiusBtnRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!radiusOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!radiusBtnRef.current?.contains(e.target as Node)) {
        setRadiusOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [radiusOpen]);

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

  // Header subtitle: only count + radius when there ARE users (or
  // while loading). The "Sin coleccionistas" message is shown as a
  // floating popup over the map area instead, per request.
  const statusText = useMemo(() => {
    if (usersLoading) return "Buscando…";
    if (!isAuthenticated) return "";
    if (users.length === 0) return fmtRadius(radius);
    return `${users.length} ${users.length === 1 ? "coleccionista" : "coleccionistas"} en ${fmtRadius(radius)}`;
  }, [usersLoading, isAuthenticated, users.length, radius]);

  const showEmptyPopup =
    isAuthenticated &&
    !usersLoading &&
    users.length === 0 &&
    !device.permissionDenied &&
    !emptyBannerDismissed;

  return (
    <main className="absolute inset-0 flex flex-col bg-bone">
      <PageHeader
        title="Radar"
        subtitle={statusText}
        actions={
          <>
            <div className="flex h-9 gap-0.5 rounded-md border border-line bg-white p-0.5 shadow-sh1">
              {(["map", "list"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`grid h-full w-8 place-items-center rounded-[8px] text-xs font-semibold transition-colors ${
                    view === v ? "bg-ink text-white" : "bg-transparent text-text-2"
                  }`}
                  aria-label={v === "map" ? "Vista mapa" : "Vista lista"}
                  aria-pressed={view === v}
                >
                  {v === "map" ? (
                    <MapIcon size={13} strokeWidth={2} />
                  ) : (
                    <List size={13} strokeWidth={2} />
                  )}
                </button>
              ))}
            </div>

            <div ref={radiusBtnRef} className="relative">
              <button
                type="button"
                onClick={() => setRadiusOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={radiusOpen}
                className="flex h-9 items-center gap-1 rounded-md border border-line bg-white px-2 text-xs font-bold text-text shadow-sh1"
              >
                <span className="font-display text-sm tabular">
                  {fmtRadius(radius)}
                </span>
                <ChevronDown
                  size={11}
                  strokeWidth={2.4}
                  className={`text-text-2 transition-transform ${
                    radiusOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {radiusOpen && (
                <ul
                  role="listbox"
                  className="absolute right-0 top-[calc(100%+4px)] z-50 min-w-[120px] overflow-hidden rounded-md border border-line bg-white shadow-sh3"
                >
                  {RADII.map((r) => {
                    const locked = r > FREE_MAX;
                    const active = r === radius;
                    return (
                      <li key={r} role="option" aria-selected={active}>
                        <button
                          type="button"
                          onClick={() => {
                            if (locked) return;
                            setRadius(r);
                            setRadiusOpen(false);
                          }}
                          disabled={locked}
                          className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${
                            active
                              ? "bg-green-50 font-bold text-green-700"
                              : locked
                                ? "text-mute"
                                : "text-text hover:bg-paper"
                          }`}
                        >
                          <span>{fmtRadius(r)}</span>
                          {locked && (
                            <Lock
                              size={12}
                              className="text-gold"
                              strokeWidth={2.4}
                            />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
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
          </>
        }
      />

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

            {showEmptyPopup && (
              <div className="absolute left-3 right-3 top-3 z-30 flex items-start gap-2 rounded-md border border-line bg-white/95 p-3 text-xs text-text-2 shadow-sh2 backdrop-blur">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-text">
                    Sin coleccionistas en {fmtRadius(radius)}
                  </p>
                  <p className="mt-1 leading-snug">
                    Amplía el radio o invita a un amigo a Cromio.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmptyBannerDismissed(true)}
                  aria-label="Cerrar aviso"
                  className="grid h-6 w-6 shrink-0 place-items-center rounded text-text-2 hover:bg-paper"
                >
                  <X size={14} strokeWidth={2.2} />
                </button>
              </div>
            )}

            {device.permissionDenied && (
              <div className="absolute left-3 right-3 top-3 z-30 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 shadow-sh2">
                <p className="font-semibold">Ubicación bloqueada</p>
                <p className="mt-1 leading-snug">
                  Centramos en tu zona guardada. Actívala en Ajustes para
                  que el mapa te siga en vivo.
                </p>
              </div>
            )}

            <button
              onClick={() => setRecenterToken((t) => t + 1)}
              aria-label="Centrar en mi ubicación"
              className="absolute bottom-3 right-3 z-30 grid h-10 w-10 place-items-center rounded-md border border-black/5 bg-white/95 shadow-sh2 backdrop-blur"
            >
              <LocateFixed size={14} strokeWidth={2} className="text-text-2" />
            </button>
            {radius === 200 && (
              <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-xs font-bold text-gold-light shadow-sh3">
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
