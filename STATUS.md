# Cromio — Project Status

<!-- AUTO:UPDATED:START -->
_Last updated: **2026-05-11 10:56 UTC** · branch `claude/review-project-setup-7OyxZ`_
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
- Match → Chat: selecting cromos in /match/[id] stitches into a
  draft message that prefills the chat input. In the chat itself
  every `#NNN` reference renders as a tappable chip that opens a
  CromoPreviewSheet with the actual sticker card.
- Chat states: meeting proposals (place + time), Aceptar/Rechazar,
  "Hecho" → completed, ★1–5 rating sheet (defaults to 0, blocks
  send until ≥1). `chat_ratings` + trigger keep
  `profiles.rating` and `trades_count` live.
- Favoritos: server-side `user_favorites` table, search debounced
  with %/_ escaped, alias + display_name match.
- Moderación: `user_blocks` (one-way) + `user_reports` (queue with
  reason + note + status). `find_nearby_users` skips both directions
  of a block, `loadChatsForCurrentUser` filters blocked counterparts,
  and the match detail kebab menu offers Bloquear / Desbloquear /
  Denunciar via a sheet.
- Notifications: in-app toasts (messages, matches/leads, generic
  success/error/info via `pushAppToast`), red badges in nav.
  Per-route `error.tsx` with Reintentar + Volver al álbum.
- Web Push pipeline (VAPID + `/sw.js` + `push_subscriptions`),
  install banner (iOS instructions / Chromium prompt).
- PWA offline shell: the SW now precaches manifest + brand icons +
  /offline.html, runtime-caches HTML (network-first) and tiles
  (cache-first). ServiceWorkerRegistrar mounts the SW on every
  visit, independent from push permission.
- Route transitions: Next 16 viewTransition flag enabled with a
  cross-fade default. Map pins fade-up + scale on entrance.
- Responsive shell: mobile keeps the 430px column with BottomNav,
  md+ shows a sticky SideNav and widens content to 760.
- Accessibility: viewport allows pinch-zoom (WCAG 1.4.4),
  `text-mute` bumped to AA contrast, every icon-only control has an
  aria-label via the shared `IconBtn` primitive.

## What is still pending

- Real PNG splash screens + screenshots in `manifest.webmanifest`.
- Pro tier (Stripe Checkout, radius unlock, badges).
- Marketplace / individual cromo trades.
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
- fdbc82d Merge remote-tracking branch origin/claude/setup-cromio-pwa-design-Tnidb into claude/review-project-setup-7OyxZ _(15 minutes ago)_
- 97ba4cb fix(nav): bottom/side nav no longer slides on route change _(17 minutes ago)_
- 531b5bf feat(contactos): rename header, show visible name, add album stats per row (#31) _(19 minutes ago)_
- c87f931 feat(admin): expose hard delete in the user detail UI _(28 minutes ago)_
- 651175c fix(album): 3-col mobile + responsive desktop + larger +/- targets (#30) _(41 minutes ago)_
- 72387b5 fix(album): 4-col grid + bigger type label + flag frame (#29) _(49 minutes ago)_
- c63b3ec fix(album): cromo card compact + counter inside the card (#28) _(84 minutes ago)_
- 39e0871 feat(album): cromo card layout per mockup (code top-left, flag top-right, type centered) (#27) _(2 hours ago)_
- 10d0d4e fix(album): realign sticker dataset to the real 980-cromo Panini album _(2 hours ago)_
- 0fae7a7 feat(admin): push admins when a new user signs up _(3 hours ago)_
- c1314ab revert: PR #25 cromo card overhaul (#26) _(3 hours ago)_
- 8042475 feat(album): cromo card UX overhaul (social signal + tap-to-detail) (#25) _(3 hours ago)_
- 7c1dd47 copy(landing-es): hero sub ends with Cromio te muestra coleccionistas a tu alrededor (#24) _(4 hours ago)_
- c6dd435 copy(landing-es): tighter "qué es" + reframed how-it-works steps (#23) _(4 hours ago)_
- 65f20c6 feat(pwa): bake the green tile into the install/favicon icon (#22) _(8 hours ago)_
<!-- AUTO:COMMITS:END -->
