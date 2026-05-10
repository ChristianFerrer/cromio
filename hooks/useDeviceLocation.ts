"use client";

import { useEffect, useState } from "react";

export type DeviceLocationState = {
  coords: [number, number] | null;
  accuracy: number | null;
  error: string | null;
  permissionDenied: boolean;
  pending: boolean;
};

export function useDeviceLocation(active = true): DeviceLocationState {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    if (!active) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("not_supported");
      setPending(false);
      return;
    }

    setPending(true);

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords([pos.coords.longitude, pos.coords.latitude]);
        setAccuracy(pos.coords.accuracy);
        setError(null);
        setPending(false);
      },
      (err) => {
        if (err.code === 1) setPermissionDenied(true);
        setError(err.message || `geolocation_${err.code}`);
        setPending(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [active]);

  return { coords, accuracy, error, permissionDenied, pending };
}
