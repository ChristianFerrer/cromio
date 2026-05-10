# Cromio — Project Status

<!-- AUTO:UPDATED:START -->
_Last updated: **2026-05-10 15:15 UTC** · branch `main`_
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

- Auth (email + Google), automatic locale (es/en).
- Album: load + adjust counts, persisted in `user_stickers` with optimistic UI.
- Mapa: Leaflet map with radar sweep, real-time nearby collectors, rotating tile cache, hyperlocal banner at 200m radius. Auto-saves device GPS to `profiles.home_location` (50m debounce).
- Chat: WhatsApp-style ticks (clock → ✓✓ gray → ✓✓ blue), day separators, message grouping, optimistic send, Realtime INSERT + UPDATE listeners with refetch on focus / interval safety net.
- Notifications: in-app toasts for new messages and new nearby matches/leads, red badges in BottomNav (chat + mapa).
- Web Push: full pipeline (VAPID, `/sw.js`, `push_subscriptions` table, `sendMessage` triggers a push to the recipient).

## What is still pending

- Onboarding flow for OAuth users without alias/color/avatar.
- Editable profile (alias, color, avatar via Supabase Storage).
- Skeletons in Favoritos / Chat list / Mapa list.
- Global toast for errors (network, action failure).
- Meeting sheet + chat state transitions (`pending → confirmed → completed`).
- Rating sheet (★1–5) after a trade completes; updates `profiles.rating` / `trades_count`.
- iOS "Add to Home Screen" install banner + screenshots in `manifest.webmanifest`.
- Service Worker offline shell (currently SW handles push only).
- Pro tier (Stripe Checkout, radius unlock, badges).
- Marketplace / individual cromo trades.

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
- 3a74e7b feat(ux): global toast bus + skeleton loaders _(3 minutes ago)_
- 0fc93eb feat(profile): editable profile + avatar upload + push toggle _(6 minutes ago)_
- edbaace feat(onboarding): identity step + redirect when home_location is null _(9 minutes ago)_
- bb19325 chore: remove demo data + add STATUS.md with auto-update hook _(11 minutes ago)_
- 61ca76c feat(push): Web Push notifications via VAPID + service worker _(37 minutes ago)_
- 7e3040e feat(notifications): in-app toasts + unread badges in bottom nav _(40 minutes ago)_
- f5cad0f fix(chat): make realtime + read receipts actually work _(68 minutes ago)_
- 3609c65 feat(chat): WhatsApp-style states with read receipts and day separators _(78 minutes ago)_
- 3b05cb5 fix: hide bottom nav inside chat detail and match detail _(85 minutes ago)_
- 9503f5c feat: remove demo fallback so map only shows real users _(3 hours ago)_
- 0587155 feat: auto-save device GPS into profile.home_location on map view _(6 hours ago)_
- 67d0342 feat: realtime nearby users + 30s polling + manual refresh button _(7 hours ago)_
- b78f47e feat: demo fallback users on map when no real collectors are nearby yet _(7 hours ago)_
- 8fd26a0 feat: add clockwise rotating radar sweep over the search radius _(7 hours ago)_
- 7208a5b fix: map z-index isolation + zoom table + bigger user pin _(7 hours ago)_
<!-- AUTO:COMMITS:END -->
