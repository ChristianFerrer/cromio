/* Cromio service worker — push notifications + offline shell. */

const VERSION = "v18";
const STATIC_CACHE = `cromio-static-${VERSION}`;
const TILE_CACHE = "cromio-tiles-v2";
const RUNTIME_CACHE = `cromio-runtime-${VERSION}`;

// Cap del cache de tiles para evitar que crezca sin límite.
// 600 tiles cubren ~25 MB en raster .png 256x256 (~40 KB cada uno).
// Cuando se supera el límite, se podan las entradas más antiguas.
const TILE_CACHE_MAX_ENTRIES = 600;
const TILE_CACHE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 días

// Files we want available without network. The HTML routes are handled
// network-first with a runtime cache, so we don't list them here.
const PRECACHE_URLS = [
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-maskable.svg",
  "/cromio_icon.png",
  "/radar_cromio.png",
  "/offline.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (k) =>
              (k.startsWith("cromio-static-") && k !== STATIC_CACHE) ||
              (k.startsWith("cromio-runtime-") && k !== RUNTIME_CACHE) ||
              (k.startsWith("cromio-tiles-") && k !== TILE_CACHE),
          )
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 1) Map tiles — cache first, long lived. The /tiles edge route already
  //    proxies to OSM with sensible cache headers; we mirror them here so a
  //    re-pan re-zoom on a flaky network reuses recent tiles. Capamos el
  //    tamaño (600 tiles ≈ 25 MB) y la edad (14 días) para no acumular sin
  //    límite en dispositivos con poco storage.
  if (url.pathname.startsWith("/tiles/")) {
    event.respondWith(
      caches.open(TILE_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) {
          const cachedAt = Number(hit.headers.get("x-cromio-cached-at") || 0);
          if (cachedAt && Date.now() - cachedAt < TILE_CACHE_MAX_AGE_MS) {
            return hit;
          }
          // Caducada: intentamos refrescar pero servimos el hit si falla.
        }
        try {
          const fresh = await fetch(req);
          if (fresh.ok) {
            const cloned = new Response(fresh.clone().body, {
              status: fresh.status,
              statusText: fresh.statusText,
              headers: new Headers(fresh.headers),
            });
            cloned.headers.set("x-cromio-cached-at", String(Date.now()));
            cache.put(req, cloned).then(() => trimTileCache(cache)).catch(() => {});
          }
          return fresh;
        } catch {
          return hit ?? Response.error();
        }
      }),
    );
    return;
  }

  // 2) HTML page navigations — network first, fall back to runtime cache,
  //    then to the offline shell so the user always gets something.
  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(req, fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          const cached = await caches.match(req);
          if (cached) return cached;
          const fallback = await caches.match("/offline.html");
          return fallback ?? Response.error();
        }
      })(),
    );
    return;
  }

  // 3) Other same-origin GETs (icons, CSS, JS chunks) — stale-while-revalidate.
  event.respondWith(
    caches.open(RUNTIME_CACHE).then(async (cache) => {
      const hit = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone()).catch(() => {});
          return res;
        })
        .catch(() => hit);
      return hit ?? network;
    }),
  );
});

/* ---------- Tile cache trim (LRU por orden de keys) ---------- */

async function trimTileCache(cache) {
  try {
    const keys = await cache.keys();
    if (keys.length <= TILE_CACHE_MAX_ENTRIES) return;
    // cache.keys() devuelve los Request en orden de inserción
    // (más antiguos primero). Borramos el exceso desde el principio.
    const excess = keys.length - TILE_CACHE_MAX_ENTRIES;
    for (let i = 0; i < excess; i++) await cache.delete(keys[i]);
  } catch {
    // Si trim falla, no es crítico — el navegador hará evict eventualmente.
  }
}

/* ---------- Web Push ---------- */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = { title: "Cromio", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Cromio";
  const options = {
    body: data.body || "",
    icon: "/cromio_icon.png",
    badge: "/icon.svg",
    tag: data.tag || undefined,
    renotify: data.tag ? true : false,
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.navigate(url).catch(() => {});
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
        return null;
      }),
  );
});
