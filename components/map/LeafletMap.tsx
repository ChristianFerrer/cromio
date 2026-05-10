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
};

export function LeafletMap({
  centerLng,
  centerLat,
  zoom,
  users,
  radiusM,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userMarkersRef = useRef<L.Marker[]>([]);
  const sweepRef = useRef<HTMLDivElement | null>(null);
  const pulseRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    const map = mapRef.current;
    const sweepEl = sweepRef.current;
    const pulseEl = pulseRef.current;
    const gridEl = gridRef.current;
    if (!map || !sweepEl || !pulseEl || !gridEl) return;

    const update = () => {
      const center = map.latLngToContainerPoint([centerLat, centerLng]);
      const cosLat = Math.cos((centerLat * Math.PI) / 180) || 1e-9;
      const edgeLng = centerLng + radiusM / 111320 / cosLat;
      const edge = map.latLngToContainerPoint([centerLat, edgeLng]);
      const radiusPx = Math.abs(edge.x - center.x);
      const diameter = radiusPx * 2;
      const visible = radiusPx > 6 ? "1" : "0";

      for (const el of [sweepEl, pulseEl, gridEl]) {
        el.style.left = `${center.x}px`;
        el.style.top = `${center.y}px`;
        el.style.width = `${diameter}px`;
        el.style.height = `${diameter}px`;
        el.style.opacity = visible;
      }
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

    if (!userMarkerRef.current) {
      const icon = L.divIcon({
        className: "",
        html: `<div class="cromio-self-dot"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      userMarkerRef.current = L.marker([centerLat, centerLng], {
        icon,
        interactive: false,
        keyboard: false,
        zIndexOffset: 500,
      }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng([centerLat, centerLng]);
    }

    if (!radiusCircleRef.current) {
      radiusCircleRef.current = L.circle([centerLat, centerLng], {
        radius: radiusM,
        color: "rgba(17,124,78,0.2)",
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

      const icon = L.divIcon({
        className: "",
        html: `
          <a href="/match/${u.id}" style="display:block;cursor:pointer;position:relative;">
            <div style="
              width:44px;height:44px;border-radius:50%;
              background:${color};color:#fff;
              border:3px solid #fff;
              box-shadow:0 4px 10px rgba(0,0,0,.22);
              display:flex;align-items:center;justify-content:center;
              font-family:var(--font-bebas),system-ui;font-size:16px;font-weight:700;
            ">${initials}</div>
            <div style="
              position:absolute;top:-8px;left:50%;transform:translateX(-50%);
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
        iconSize: [44, 44],
        iconAnchor: [22, 44],
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
      <div
        ref={pulseRef}
        className="cromio-radar-pulse-wrapper"
        style={{
          position: "absolute",
          pointerEvents: "none",
          transform: "translate(-50%, -50%)",
          zIndex: 440,
        }}
      >
        <div className="cromio-radar-tint" />
        <div className="cromio-radar-pulse" />
        <div className="cromio-radar-pulse cromio-radar-pulse--late" />
      </div>
      <div
        ref={gridRef}
        aria-hidden
        style={{
          position: "absolute",
          pointerEvents: "none",
          transform: "translate(-50%, -50%)",
          zIndex: 445,
        }}
      >
        <svg
          viewBox="0 0 100 100"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <clipPath id="cromio-radar-grid-clip">
              <circle cx="50" cy="50" r="50" />
            </clipPath>
            {/* Cardinal cross: opaque at center, transparent at the
                radar edge so the lines fade naturally into the scope. */}
            <linearGradient
              id="cromio-radar-cross-v"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="rgba(17,124,78,0)" />
              <stop offset="50%" stopColor="rgba(17,124,78,0.55)" />
              <stop offset="100%" stopColor="rgba(17,124,78,0)" />
            </linearGradient>
            <linearGradient
              id="cromio-radar-cross-h"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor="rgba(17,124,78,0)" />
              <stop offset="50%" stopColor="rgba(17,124,78,0.55)" />
              <stop offset="100%" stopColor="rgba(17,124,78,0)" />
            </linearGradient>
          </defs>
          <g
            clipPath="url(#cromio-radar-grid-clip)"
            stroke="rgba(17,124,78,0.2)"
            fill="none"
          >
            {/* Concentric range rings (25% / 50% / 75% of radius) */}
            <circle cx="50" cy="50" r="12.5" strokeWidth="0.18" strokeDasharray="0.8 1.4" />
            <circle cx="50" cy="50" r="25" strokeWidth="0.18" strokeDasharray="0.8 1.4" />
            <circle cx="50" cy="50" r="37.5" strokeWidth="0.2" strokeDasharray="1 1.6" />
          </g>
          {/* Cardinal crosshair with fade-out gradient toward the edges */}
          <line
            x1="50"
            y1="0"
            x2="50"
            y2="100"
            stroke="url(#cromio-radar-cross-v)"
            strokeWidth="0.22"
            clipPath="url(#cromio-radar-grid-clip)"
          />
          <line
            x1="0"
            y1="50"
            x2="100"
            y2="50"
            stroke="url(#cromio-radar-cross-h)"
            strokeWidth="0.22"
            clipPath="url(#cromio-radar-grid-clip)"
          />
        </svg>
      </div>
      <div
        ref={sweepRef}
        className="cromio-radar-sweep-wrapper"
        style={{
          position: "absolute",
          pointerEvents: "none",
          transform: "translate(-50%, -50%)",
          zIndex: 450,
        }}
      >
        <div className="cromio-radar-sweep" />
        <div className="cromio-radar-arm" />
      </div>
    </div>
  );
}
