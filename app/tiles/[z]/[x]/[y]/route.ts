import { type NextRequest, NextResponse } from "next/server";

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

  const upstream = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

  let res: Response;
  try {
    res = await fetch(upstream, {
      headers: {
        "User-Agent":
          "Cromio/0.1 (https://cromio-one.vercel.app; +https://github.com/ChristianFerrer/cromio) Educational sticker-trading app",
        Referer: "https://cromio-one.vercel.app/",
        Accept: "image/png,image/*;q=0.9,*/*;q=0.8",
      },
    });
  } catch (err) {
    console.error("[cromio] tile upstream fetch threw:", err);
    return new NextResponse("upstream_unreachable", { status: 502 });
  }

  if (!res.ok) {
    console.error(
      `[cromio] tile upstream ${upstream} -> ${res.status} ${res.statusText}`,
    );
    return new NextResponse(`upstream_${res.status}`, { status: res.status });
  }

  const body = await res.arrayBuffer();
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
