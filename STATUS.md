# Cromio — Project Status

<!-- AUTO:UPDATED:START -->
_Last updated: **2026-05-10 19:53 UTC** · branch `main`_
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

- Auth (email + Google), `/login/recuperar` for password reset, dynamic
  `<html lang>` from the locale. All `(app)` routes redirect to
  `/login` when anonymous and `/onboarding` when the profile has no
  `home_location`. No demo data anywhere.
- Onboarding: 4-step wizard with a Stepper ("Paso N de 4" + progress
  bar + back button). Location step never falls back silently — on
  permission denied / timeout it shows an inline warning, offers
  Reintentar plus a curated city picker.
- Identity / editar: alias is validated inline (regex feedback,
  aria-invalid, red border) and the unique-violation surfaces as
  `alias_taken`. Editar warns on unsaved-changes exit and disables
  Save until something actually changed.
- Profile: real avatar / color disc, rating, trades_count, album
  stats. Storage `avatars` bucket. Push toggle per device.
- Album: header Search opens AddCromoSheet; FAB does the same. No
  more `window.prompt`. Filter chip "Repetidas" sums extras.
- Mapa: Leaflet + radar sweep, real-time nearby collectors, GPS
  auto-save with 50m debounce, dismissible warning banners.
- Chat: WhatsApp-style ticks (clock → ✓✓ gray → ✓✓ blue), day
  separators, optimistic send, Realtime INSERT + UPDATE + chats
  state. Input is a textarea with auto-grow + Enter submits.
- Match → Chat: selecting cromos in /match/[id] is now stitched into
  a draft message that prefills the chat input on first load.
- Chat states: meeting proposals (place + time), Aceptar/Rechazar,
  "Hecho" → completed, ★1–5 rating sheet (defaults to 0, blocks
  send until ≥1). `chat_ratings` + trigger keep
  `profiles.rating` and `trades_count` live.
- Favoritos: server-side `user_favorites` table, search debounced
  with %/_ escaped, alias + display_name match.
- Notifications: in-app toasts (messages, matches/leads, generic
  success/error/info via `pushAppToast`), red badges in nav.
  Per-route `error.tsx` with Reintentar + Volver al álbum.
- Web Push pipeline (VAPID + `/sw.js` + `push_subscriptions`),
  install banner (iOS instructions / Chromium prompt).
- Responsive shell: mobile keeps the 430px column with BottomNav,
  md+ shows a sticky SideNav and widens content to 760.
- Accessibility: viewport allows pinch-zoom (WCAG 1.4.4),
  `text-mute` bumped to AA contrast, every icon-only control has an
  aria-label via the shared `IconBtn` primitive.

## What is still pending

- Service Worker offline shell (currently SW handles push only;
  no precache/runtime caching of the app shell or tile cache).
- Real PNG splash screens + screenshots in `manifest.webmanifest`.
- Pro tier (Stripe Checkout, radius unlock, badges).
- Marketplace / individual cromo trades.
- Per-cromo deep-link from a map pin into chat with preview.
- Report / block flow for users.
- View Transitions API for route changes.
- Privacy / Terms / About pages (currently hidden from /perfil
  until they exist).

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
- 49c98b9 feat(brand): cromio_bg.png as the app logo across favicon + headers _(19 minutes ago)_
- d023680 Add files via upload _(28 minutes ago)_
- c0cfeab fix(mapa): radar above tiles, dot + pins above radar _(40 minutes ago)_
- d724c58 feat(mapa): radar to background z-index + teardrop pins _(54 minutes ago)_
- e7d4768 feat(mapa): Whistle-style radar — minimal scope + recenter button _(61 minutes ago)_
- c6316aa fix(mapa): grid alpha 0.4, user dot promoted above the radar _(73 minutes ago)_
- 66ff06a fix(mapa): original-style pulse + solid rings + quadrant cross _(78 minutes ago)_
- a3b4039 feat(mapa): radar rings track filter steps + drop cardinal cross _(85 minutes ago)_
- 9725a18 fix(mapa): rings 60%, single louder pulse, drop the tint _(2 hours ago)_
- 07b9390 fix(mapa): radar grid thinner @ 20%, cardinals with edge-fade gradient _(2 hours ago)_
- 559329c feat(mapa): radar scope look — range rings, cardinals, sweep arm _(2 hours ago)_
- 4527a2d fix(mapa): pulse fills the radar + solid radar border _(2 hours ago)_
- d39243c fix(flags): SVG flags with proper bounds, no escaping sun _(2 hours ago)_
- f8fb9c8 feat(forms+ux): forgot pwd, signup confirm, error.tsx, perfil cleanup _(3 hours ago)_
- 55121af feat(chat+match): selection handoff, textarea, 0-star rate, day labels _(3 hours ago)_
<!-- AUTO:COMMITS:END -->
