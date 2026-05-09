# Cromio

PWA mobile-first hiperlocal que conecta coleccionistas del álbum **Panini Mundial 2026** por geolocalización para intercambiar cromos físicos.

> App no oficial. No afiliada con Panini Group ni FIFA.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** con design tokens de Cromio
- **Supabase** (auth + Postgres + Realtime + PostGIS) — proyecto `ohjhnovjchwaqamgoqcf` (eu-west-1)
- **MapLibre GL** + tiles **OpenFreeMap**
- **next-intl** con auto-detect del idioma del navegador (ES por defecto, EN fallback)
- **PWA** instalable con manifest + service worker

## Variables de entorno

Copia `.env.example` a `.env.local` (o configúralas en Vercel):

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/positron
```

## Despliegue

- **Producción**: branch `main` → push directo → Vercel deploya automáticamente.
- **Base de datos**: migraciones en `supabase/migrations/`. Aplicación vía Supabase MCP.

## Estructura

```
app/
  [locale]/
    (app)/
      album/      # Catálogo de cromos del usuario
      mapa/       # MapLibre + matches por geolocalización
      favoritos/  # Coleccionistas marcados
      chat/       # Conversaciones (Realtime)
      perfil/     # Perfil del usuario
components/       # UI compartida
lib/supabase/     # Clientes browser + server
i18n/             # next-intl routing + request config
messages/         # ES + EN
```
