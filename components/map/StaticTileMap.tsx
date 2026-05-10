"use client";

import Link from "next/link";
import type { NearbyUser } from "@/hooks/useNearbyUsers";

const TILE_SIZE = 256;
const ZOOM = 14;

function lngLatToWorldPx(lng: number, lat: number) {
  const n = 2 ** ZOOM;
  const latRad = (lat * Math.PI) / 180;
  const x = ((lng + 180) / 360) * n * TILE_SIZE;
  const y =
    ((1 -
      Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) /
      2) *
    n *
    TILE_SIZE;
  return { x, y };
}

function bearingToLngLat(
  centerLng: number,
  centerLat: number,
  bearingDeg: number,
  distanceM: number,
): [number, number] {
  const rad = (bearingDeg * Math.PI) / 180;
  const dLng =
    (Math.cos(rad) * distanceM) /
    (111320 * Math.cos((centerLat * Math.PI) / 180));
  const dLat = (Math.sin(rad) * distanceM) / 110540;
  return [centerLng + dLng, centerLat + dLat];
}

export function StaticTileMap({
  centerLng,
  centerLat,
  users,
  width,
  height,
}: {
  centerLng: number;
  centerLat: number;
  users: NearbyUser[];
  width: number;
  height: number;
}) {
  const center = lngLatToWorldPx(centerLng, centerLat);
  const centerTileX = Math.floor(center.x / TILE_SIZE);
  const centerTileY = Math.floor(center.y / TILE_SIZE);

  const tilesX = Math.ceil(width / TILE_SIZE) + 2;
  const tilesY = Math.ceil(height / TILE_SIZE) + 2;
  const startX = centerTileX - Math.floor(tilesX / 2);
  const startY = centerTileY - Math.floor(tilesY / 2);

  const tiles: Array<{ tx: number; ty: number; left: number; top: number }> = [];
  for (let dy = 0; dy < tilesY; dy++) {
    for (let dx = 0; dx < tilesX; dx++) {
      const tx = startX + dx;
      const ty = startY + dy;
      const left = width / 2 + tx * TILE_SIZE - center.x;
      const top = height / 2 + ty * TILE_SIZE - center.y;
      tiles.push({ tx, ty, left, top });
    }
  }

  return (
    <div
      className="relative overflow-hidden bg-[#F2EFE9]"
      style={{ width, height }}
    >
      {tiles.map((t) => (
        <img
          key={`${t.tx}-${t.ty}`}
          src={`/tiles/${ZOOM}/${t.tx}/${t.ty}.png`}
          alt=""
          width={TILE_SIZE}
          height={TILE_SIZE}
          decoding="async"
          loading="lazy"
          draggable={false}
          className="absolute select-none"
          style={{
            left: t.left,
            top: t.top,
            filter: "saturate(0.85) brightness(1.02)",
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
          }}
        />
      ))}

      <div
        className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-green-500 shadow-md"
        style={{ left: width / 2, top: height / 2 }}
      />

      {users.map((u) => {
        const [ulng, ulat] = bearingToLngLat(
          centerLng,
          centerLat,
          u.bearing_deg,
          u.distance_m,
        );
        const upx = lngLatToWorldPx(ulng, ulat);
        const left = width / 2 + (upx.x - center.x);
        const top = height / 2 + (upx.y - center.y);
        const color = u.kind === "match" ? "#1FAE5A" : "#2D7DD8";

        return (
          <Link
            key={u.id}
            href={`/match/${u.id}`}
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{ left, top }}
          >
            <div
              className="grid h-11 w-11 place-items-center rounded-full font-display text-base text-white"
              style={{
                background: color,
                border: "3px solid #fff",
                boxShadow: "0 4px 10px rgba(0,0,0,.22)",
              }}
            >
              {u.alias.slice(0, 2).toUpperCase()}
            </div>
            <div className="absolute -top-2 left-1/2 flex -translate-x-1/2 gap-1 rounded-md bg-white px-1.5 py-0.5 font-display text-[10px] shadow-sh1">
              <span style={{ color: "#117C4E" }}>▼{u.you_get_count}</span>
              <span style={{ color: "#D7263D" }}>▲{u.they_get_count}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
