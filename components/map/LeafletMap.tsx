"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { NearbyUser } from "@/hooks/useNearbyUsers";
import { bearingToLngLat } from "@/lib/map/math";
import { CROMIO_COLORS } from "@/lib/design/colors";

type Props = {
  centerLng: number;
  centerLat: number;
  zoom: number;
  users: NearbyUser[];
  radiusM: number;
  /** Bumped by the parent to force the map to re-center on the user. */
  recenterToken?: number;
};

export function LeafletMap({
  centerLng,
  centerLat,
  zoom,
  users,
  radiusM,
  recenterToken,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const userMarkersRef = useRef<L.Marker[]>([]);
  const sweepRef = useRef<HTMLDivElement | null>(null);
  const pulseRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const programmaticMoveRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [centerLat, centerLng],
      zoom,
      zoomControl: false,
      attributionControl: false,
      bounceAtZoomLimits: false,
      minZoom: 3,
      maxZoom: 18,
    });

    L.tileLayer("/tiles/{z}/{x}/{y}.png", {
      maxZoom: 18,
      tileSize: 256,
      detectRetina: false,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    L.control
      .attribution({ position: "bottomright", prefix: false })
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    programmaticMoveRef.current = true;
    map.setView([centerLat, centerLng], zoom, { animate: true, duration: 0.5 });
    setTimeout(() => {
      programmaticMoveRef.current = false;
    }, 600);
  }, [centerLat, centerLng, zoom]);

  // Force-recenter when the parent bumps the token (user pressed
  // "Centrar en mi ubicación" after panning).
  useEffect(() => {
    if (!recenterToken) return;
    const map = mapRef.current;
    if (!map) return;
    programmaticMoveRef.current = true;
    map.setView([centerLat, centerLng], zoom, { animate: true, duration: 0.5 });
    setTimeout(() => {
      programmaticMoveRef.current = false;
    }, 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterToken]);

  useEffect(() => {
    const map = mapRef.current;
    const sweepEl = sweepRef.current;
    const pulseEl = pulseRef.current;
    const dotEl = dotRef.current;
    if (!map || !sweepEl || !pulseEl || !dotEl) return;

    const update = () => {
      const center = map.latLngToContainerPoint([centerLat, centerLng]);
      const cosLat = Math.cos((centerLat * Math.PI) / 180) || 1e-9;
      const edgeLng = centerLng + radiusM / 111320 / cosLat;
      const edge = map.latLngToContainerPoint([centerLat, edgeLng]);
      const radiusPx = Math.abs(edge.x - center.x);
      const diameter = radiusPx * 2;
      const visible = radiusPx > 6 ? "1" : "0";

      for (const el of [sweepEl, pulseEl]) {
        el.style.left = `${center.x}px`;
        el.style.top = `${center.y}px`;
        el.style.width = `${diameter}px`;
        el.style.height = `${diameter}px`;
        el.style.opacity = visible;
      }

      dotEl.style.left = `${center.x}px`;
      dotEl.style.top = `${center.y}px`;
    };

    update();
    map.on("move", update);
    map.on("zoom", update);
    map.on("moveend", update);
    map.on("zoomend", update);

    return () => {
      map.off("move", update);
      map.off("zoom", update);
      map.off("moveend", update);
      map.off("zoomend", update);
    };
  }, [centerLat, centerLng, radiusM, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!radiusCircleRef.current) {
      radiusCircleRef.current = L.circle([centerLat, centerLng], {
        radius: radiusM,
        color: "rgba(17,124,78,0.4)",
        weight: 1,
        fillColor: CROMIO_COLORS.green[500],
        fillOpacity: 0.06,
        interactive: false,
      }).addTo(map);
    } else {
      radiusCircleRef.current.setLatLng([centerLat, centerLng]);
      radiusCircleRef.current.setRadius(radiusM);
    }
  }, [centerLat, centerLng, radiusM]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    userMarkersRef.current.forEach((m) => m.remove());
    userMarkersRef.current = [];

    users.forEach((u) => {
      if (u.distance_m > radiusM) return;
      const [ulng, ulat] = bearingToLngLat(
        centerLng,
        centerLat,
        u.bearing_deg,
        u.distance_m,
      );
      const color =
        u.kind === "match" ? CROMIO_COLORS.green[500] : CROMIO_COLORS.match.interest;
      const initials = u.alias.slice(0, 2).toUpperCase();

      // Whistle-style teardrop pin: rounded body with a pointed tip
      // anchored at the location. The avatar circle sits inside the
      // bulb; the trade counter chip floats above the pin head.
      const icon = L.divIcon({
        className: "",
        html: `
          <a href="/match/${u.id}" style="display:block;cursor:pointer;position:relative;">
            <svg
              width="40" height="52" viewBox="0 0 40 52"
              style="display:block;filter:drop-shadow(0 4px 8px rgba(0,0,0,.28));"
            >
              <path
                d="M20,2
                   C9.5,2 2,10 2,20
                   C2,30 14,42 20,50
                   C26,42 38,30 38,20
                   C38,10 30.5,2 20,2 Z"
                fill="${color}"
                stroke="#ffffff"
                stroke-width="2.5"
                stroke-linejoin="round"
              />
              <circle cx="20" cy="20" r="13" fill="rgba(255,255,255,0.18)" />
              <text
                x="20" y="20"
                text-anchor="middle"
                dominant-baseline="central"
                font-family="var(--font-bebas), system-ui"
                font-size="14" font-weight="700"
                fill="#ffffff" letter-spacing="0.5"
              >${initials}</text>
            </svg>
            <div style="
              position:absolute;top:-6px;left:50%;transform:translateX(-50%);
              background:#fff;border-radius:8px;padding:1px 6px;
              box-shadow:0 2px 6px rgba(0,0,0,.18);
              font-family:var(--font-bebas),system-ui;font-size:11px;
              display:flex;gap:3px;white-space:nowrap;
            ">
              <span style="color:${CROMIO_COLORS.trade.get}">▼${u.you_get_count}</span>
              <span style="color:${CROMIO_COLORS.trade.give}">▲${u.they_get_count}</span>
            </div>
          </a>
        `,
        iconSize: [40, 52],
        iconAnchor: [20, 50],
      });

      const marker = L.marker([ulat, ulng], { icon }).addTo(map);
      userMarkersRef.current.push(marker);
    });
  }, [users, centerLat, centerLng, radiusM]);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ touchAction: "none", background: "#F2EFE9", zIndex: 0 }}
    >
      <div ref={containerRef} className="absolute inset-0" />
      {/* Stack inside the Leaflet container:
            tiles(200) → overlayPane(400, perimeter circle)
            → pulse(410) → sweep(420)
            → markerPane(600, other-user pins)
            → dot(700, the "you are here" dot — always on top). */}
      <div
        ref={pulseRef}
        className="cromio-radar-pulse-wrapper"
        style={{
          position: "absolute",
          pointerEvents: "none",
          transform: "translate(-50%, -50%)",
          zIndex: 410,
        }}
      >
        <div className="cromio-radar-pulse" />
        <div className="cromio-radar-pulse cromio-radar-pulse--late" />
      </div>
      <div
        ref={sweepRef}
        className="cromio-radar-sweep-wrapper"
        style={{
          position: "absolute",
          pointerEvents: "none",
          transform: "translate(-50%, -50%)",
          zIndex: 420,
        }}
      >
        <div className="cromio-radar-sweep" />
      </div>
      <div
        ref={dotRef}
        aria-hidden
        style={{
          position: "absolute",
          pointerEvents: "none",
          transform: "translate(-50%, -50%)",
          zIndex: 700,
        }}
      >
        <div className="cromio-self-dot" />
      </div>
    </div>
  );
}
