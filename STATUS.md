# Cromio — Project Status

<!-- AUTO:UPDATED:START -->
_Last updated: **2026-05-10 15:50 UTC** · branch `main`_
<!-- AUTO:UPDATED:END -->

> Hyperlocal PWA that connects collectors of the **Panini Mundial 2026** album by geolocation so they can swap stickers in person.

## Stack at a glance

| Layer | Tech |
|---|---|
| App | Next.js 16 App Router (Turbopack), React 19, Tailwind CSS, next-intl 4 (`as-needed` locale prefix) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Data | Supabase Postgres + PostGIS, RLS on every table |
| Realtime | Supabase Realtime (`postgres_changes`) for messages, profiles, user_stickers, push_subscriptions |
| Map | Leaflet 1.9 (no WebGL) over a same-origin `/tiles/{z}/{x}/{y}` Edge proxy to OpenStreetMap |
| Notifications | In-app toasts + per-tab badges + Web Push (VAPID) |
| Hosting | Vercel (Node runtime by default, Edge runtime for `/tiles`) |

## Routing

```
/[locale]/(auth)
  ├── login
  ├── signup
  └── onboarding
/[locale]/(app)
  ├── album       — collection grid grouped by team / specials / stadiums
  ├── mapa        — Leaflet map + radar sweep, list view, radius slider
  ├── favoritos   — pinned collectors
  ├── chat        — list of conversations
  ├── chat/[id]   — one-to-one chat with WhatsApp-style states
  ├── match/[id]  — pairwise match detail (you-get / they-get cromos)
  └── perfil      — settings, plan, sign out
/auth/callback   — OAuth code exchange
/tiles/[z]/[x]/[y] — Edge route proxying tile.openstreetmap.org
```

## Database (Supabase project `cromio` / `ohjhnovjchwaqamgoqcf`)

| Table | Purpose |
|---|---|
| `profiles` | One row per auth user. `home_location geography(Point,4326)`, `alias`, `color`, `rating`, `trades_count`, `plan`. |
| `user_stickers` | `(user_id, sticker_n) → count`. Source of truth for the album. |
| `chats` | Pairwise `(user_a, user_b)` with `state pending|confirmed|completed|cancelled`. |
| `messages` | Chat messages. `read_by_recipient_at` flips when recipient opens the chat. RLS UPDATE policy is owned by recipient only. REPLICA IDENTITY FULL so Realtime UPDATE events ship the full row. |
| `push_subscriptions` | Web Push endpoints (`endpoint`, `p256dh`, `auth`) keyed to a user. RLS scoped to the owner. |

Key RPCs: `find_nearby_users(p_user_id, p_radius_m)`, `get_my_location()`, `get_or_create_chat(p_other_user_id)`.

## Required env vars

| Var | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + `.env.local` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + `.env.local` | Public |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Vercel | Used by client to subscribe to Web Push |
| `VAPID_PRIVATE_KEY` | Vercel | Server-only, signs push payloads |
| `VAPID_SUBJECT` | Vercel | `mailto:` contact, RFC 8292 |

Generate VAPID keys with `npx web-push generate-vapid-keys --json`.

## What works

- Auth (email + Google), automatic locale (es/en). All `(app)` routes
  hard-redirect to `/login` when anonymous, and to `/onboarding` when
  the profile has no `home_location`. No demo data anywhere.
- Onboarding (location → identity → favorite team → first cromos),
  saving alias, display name, color and `home_location` in one shot.
- Profile: real avatar (or color disc), rating, trades_count, album
  stats. `/perfil/editar` updates alias / display_name / color and
  uploads avatar to a Supabase Storage `avatars` bucket (public read,
  owner-scoped writes). Push toggle on /perfil for per-device control.
- Album: load + adjust counts, persisted in `user_stickers` with
  optimistic UI; banner derived from a real `find_nearby_users` call.
- Mapa: Leaflet map with radar sweep, real-time nearby collectors,
  rotating tile cache, hyperlocal banner at 200m radius. Auto-saves
  device GPS to `profiles.home_location` (50m debounce).
- Chat: WhatsApp-style ticks (clock → ✓✓ gray → ✓✓ blue), day
  separators, message grouping, optimistic send, Realtime INSERT +
  UPDATE listeners with refetch on focus / interval safety net.
- Chat states: meeting proposals (place + time), Aceptar/Rechazar
  banner, "Hecho" → completed, ★1–5 rating sheet. `chat_ratings`
  + trigger keep `profiles.rating` and `profiles.trades_count` live.
- Favoritos: real profile lookups, alias search, distance + match
  counts via `find_nearby_users`.
- Notifications: in-app toasts (messages, matches/leads, generic
  success/error/info via `pushAppToast`), red badges in BottomNav
  (chat + mapa). Skeletons on /chat, /chat/[id] and /perfil.
- Web Push: full pipeline (VAPID, `/sw.js`, `push_subscriptions`
  table, `sendMessage` and meeting actions trigger pushes).
- Install banner: iOS Safari → "Añadir a pantalla de inicio"
  instructions, Chromium → `beforeinstallprompt` button. Manifest
  declares shortcuts for /mapa, /album, /chat.

## What is still pending

- Service Worker offline shell (currently SW handles push only;
  no precache/runtime caching of the app shell or tile cache).
- Real PNG splash screens + screenshots in `manifest.webmanifest`.
- Pro tier (Stripe Checkout, radius unlock, badges).
- Marketplace / individual cromo trades.
- Per-cromo deep-link from a map pin into chat with preview.
- Report / block flow for users.
- View Transitions API for route changes.

## How this file stays current

`scripts/update-status.mjs` regenerates the auto-managed sections below. The
git pre-commit hook in `.githooks/pre-commit` runs it and stages the file, so
every commit captures a fresh snapshot.

To wire the hook on a fresh checkout:
```
npm install   # runs `npm run prepare` which sets core.hooksPath = .githooks
```

Or manually: `git config core.hooksPath .githooks`.

## Recent commits

<!-- AUTO:COMMITS:START -->
- e500ad1 fix(favoritos): server-side favorites in user_favorites + UX _(5 minutes ago)_
- 506976b feat(pwa): install banner (iOS + Chromium) + manifest shortcuts _(33 minutes ago)_
- 463fea7 feat(chat): meeting proposals + rating after trade _(35 minutes ago)_
- 3a74e7b feat(ux): global toast bus + skeleton loaders _(38 minutes ago)_
- 0fc93eb feat(profile): editable profile + avatar upload + push toggle _(41 minutes ago)_
- edbaace feat(onboarding): identity step + redirect when home_location is null _(44 minutes ago)_
- bb19325 chore: remove demo data + add STATUS.md with auto-update hook _(46 minutes ago)_
- 61ca76c feat(push): Web Push notifications via VAPID + service worker _(72 minutes ago)_
- 7e3040e feat(notifications): in-app toasts + unread badges in bottom nav _(75 minutes ago)_
- f5cad0f fix(chat): make realtime + read receipts actually work _(2 hours ago)_
- 3609c65 feat(chat): WhatsApp-style states with read receipts and day separators _(2 hours ago)_
- 3b05cb5 fix: hide bottom nav inside chat detail and match detail _(2 hours ago)_
- 9503f5c feat: remove demo fallback so map only shows real users _(4 hours ago)_
- 0587155 feat: auto-save device GPS into profile.home_location on map view _(7 hours ago)_
- 67d0342 feat: realtime nearby users + 30s polling + manual refresh button _(7 hours ago)_
<!-- AUTO:COMMITS:END -->
