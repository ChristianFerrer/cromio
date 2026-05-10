const EARTH_CIRCUMFERENCE = 40075016.686;
const PIXELS_PER_TILE_AT_ZOOM_0 = EARTH_CIRCUMFERENCE / 256;

export function zoomForRadius(
  radiusM: number,
  lat: number,
  viewportMinDim: number,
  targetRadiusFraction = 0.4,
) {
  if (viewportMinDim <= 0) return 14;
  const targetRadiusPx = viewportMinDim * targetRadiusFraction;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const z = Math.log2(
    (targetRadiusPx * cosLat * PIXELS_PER_TILE_AT_ZOOM_0) / radiusM,
  );
  return Math.max(3, Math.min(18, Math.round(z)));
}

export function bearingToLngLat(
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
