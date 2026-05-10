"use client";

import dynamic from "next/dynamic";

export const LeafletMap = dynamic(
  () => import("./LeafletMap").then((m) => m.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-[#F2EFE9]" />
    ),
  },
);

export { zoomForRadius } from "@/lib/map/math";
