import { type NextRequest, NextResponse } from "next/server";

const SUBDOMAINS = ["a", "b", "c", "d"];

export const runtime = "edge";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> },
) {
  const { z, x, y: yRaw } = await params;
  const y = yRaw.replace(/\.png$/, "");

  if (!/^\d+$/.test(z) || !/^\d+$/.test(x) || !/^\d+$/.test(y)) {
    return new NextResponse("bad_tile_coords", { status: 400 });
  }

  const sub = SUBDOMAINS[(Number(x) + Number(y)) % SUBDOMAINS.length];
  const upstream = `https://${sub}.basemaps.cartocdn.com/voyager/${z}/${x}/${y}.png`;

  const res = await fetch(upstream, {
    headers: {
      "User-Agent": "Cromio/1.0 (+https://cromio-one.vercel.app)",
    },
    cf: { cacheTtl: 86400, cacheEverything: true },
  } as RequestInit);

  if (!res.ok) {
    return new NextResponse(`upstream_${res.status}`, { status: res.status });
  }

  const body = await res.arrayBuffer();
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
