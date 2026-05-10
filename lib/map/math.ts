export function zoomForRadius(radiusM: number): number {
  if (radiusM <= 200) return 17;
  if (radiusM <= 500) return 16;
  if (radiusM <= 1000) return 15;
  if (radiusM <= 2000) return 14;
  if (radiusM <= 5000) return 13;
  if (radiusM <= 10000) return 11;
  return 9;
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
