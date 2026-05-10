"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapIcon, List, Lock, RefreshCw, X, LocateFixed } from "lucide-react";
import Link from "next/link";
import { useNearbyUsers } from "@/hooks/useNearbyUsers";
import { useDeviceLocation } from "@/hooks/useDeviceLocation";
import { fmtDistance } from "@/lib/matches";
import { saveHomeLocation } from "@/lib/profile/actions";
import { CROMIO_COLORS } from "@/lib/design/colors";
import { MatchArrows } from "@/components/match/MatchArrows";
import { LeafletMap, zoomForRadius } from "@/components/map/LeafletMapClient";

const RADII = [200, 500, 1000, 2000, 5000, 10000, 50000];
const FREE_MAX = 2000;

export default function MapaPage() {
  const [radius, setRadius] = useState(1000);
  const [view, setView] = useState<"map" | "list">("map");
  const [listFilter, setListFilter] = useState<"all" | "match" | "lead">("all");
  const [bannersHidden, setBannersHidden] = useState({
    location: false,
    empty: false,
  });
  const [recenterToken, setRecenterToken] = useState(0);
  // Re-show the empty banner whenever the radius changes (the message
  // depends on radius so dismissing for 200m shouldn't hide it for 5km).
  useEffect(() => {
    setBannersHidden((b) => ({ ...b, empty: false }));
  }, [radius]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mapDims, setMapDims] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });

  const {
    users,
    center: profileCenter,
    isAuthenticated,
    loading: usersLoading,
    refresh: refreshUsers,
  } = useNearbyUsers(radius);
  const device = useDeviceLocation(view === "map");

  const center: [number, number] = device.coords ?? profileCenter;

  const zoom = useMemo(() => zoomForRadius(radius), [radius]);

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
        <div
          ref={containerRef}
          className="absolute inset-0 z-0 bg-[#F2EFE9]"
        >
          {mapDims.w > 0 && mapDims.h > 0 && (
            <LeafletMap
              centerLng={center[0]}
              centerLat={center[1]}
              zoom={zoom}
              users={users}
              radiusM={radius}
              recenterToken={recenterToken}
            />
          )}
        </div>
      )}

      {view === "map" && device.permissionDenied && !bannersHidden.location && (
        <div className="absolute left-3 right-3 top-28 z-30 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 shadow-sh2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Ubicación bloqueada</p>
            <p className="mt-1 leading-snug">
              Activa la ubicación en Ajustes → Safari → Ubicación para que el mapa te
              siga en vivo. Mientras tanto centramos en tu zona guardada.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBannersHidden((b) => ({ ...b, location: true }))}
            aria-label="Cerrar aviso"
            className="grid h-6 w-6 shrink-0 place-items-center rounded text-amber-900/70 hover:bg-amber-100"
          >
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>
      )}

      {view === "map" &&
        isAuthenticated &&
        !usersLoading &&
        users.length === 0 &&
        !device.permissionDenied &&
        !bannersHidden.empty && (
          <div className="absolute left-3 right-3 top-28 z-30 flex items-start gap-2 rounded-md border border-line bg-white/95 p-3 text-xs text-text-2 shadow-sh2 backdrop-blur">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-text">
                Sin coleccionistas en {radius >= 1000 ? `${radius / 1000} km` : `${radius} m`}
              </p>
              <p className="mt-1 leading-snug">
                Amplía el radio en el slider de abajo o invita a un amigo a Cromio.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setBannersHidden((b) => ({ ...b, empty: true }))}
              aria-label="Cerrar aviso"
              className="grid h-6 w-6 shrink-0 place-items-center rounded text-text-2 hover:bg-paper"
            >
              <X size={14} strokeWidth={2.2} />
            </button>
          </div>
        )}

      <div className="absolute right-3 top-14 z-30 flex items-center gap-2">
        <div className="flex h-10 gap-0.5 rounded-md border border-black/5 bg-white/95 p-0.5 shadow-sh2 backdrop-blur">
          {(["map", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`grid h-full w-10 place-items-center rounded-[10px] text-xs font-semibold transition-colors ${
                view === v ? "bg-ink text-white" : "bg-transparent text-text-2"
              }`}
              aria-label={v === "map" ? "Vista mapa" : "Vista lista"}
              aria-pressed={view === v}
            >
              {v === "map" ? <MapIcon size={14} strokeWidth={2} /> : <List size={14} strokeWidth={2} />}
            </button>
          ))}
        </div>
        {isAuthenticated && (
          <button
            onClick={refreshUsers}
            className="grid h-10 w-10 place-items-center rounded-md border border-black/5 bg-white/95 shadow-sh2 backdrop-blur"
            aria-label="Refrescar usuarios cercanos"
            disabled={usersLoading}
          >
            <RefreshCw
              size={14}
              strokeWidth={2}
              className={usersLoading ? "animate-spin text-green-700" : "text-text-2"}
            />
          </button>
        )}
      </div>

      {view === "map" && radius === 200 && (
        <div className="absolute left-1/2 top-28 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-xs font-bold text-gold-light shadow-sh3 animate-slide-down">
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
                { id: "lead", label: "Te interesa", color: CROMIO_COLORS.match.interest },
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

      {view === "map" && (
        <button
          onClick={() => setRecenterToken((t) => t + 1)}
          aria-label="Centrar en mi ubicación"
          className="absolute bottom-44 right-3 z-30 grid h-11 w-11 place-items-center rounded-full border border-black/5 bg-white/95 shadow-sh3 backdrop-blur transition-transform active:scale-95"
        >
          <LocateFixed size={18} strokeWidth={2} className="text-text" />
        </button>
      )}

      <div className="absolute bottom-24 left-3 right-3 z-30 rounded-xl border border-black/5 bg-white/95 p-3.5 shadow-sh3 backdrop-blur">
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
  const avatarColor = isLead ? CROMIO_COLORS.match.interest : CROMIO_COLORS.green[500];
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
      </div>
      <MatchArrows
        recibes={isLead ? 0 : u.you_get_count}
        entregas={isLead ? 0 : u.they_get_count}
        size={18}
      />
    </Link>
  );
}
