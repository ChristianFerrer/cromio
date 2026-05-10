# Cromio — agent context

This file is read by Claude Code at session start. Keep it short and
operational. Convention recap and decisions, not architecture essays.

## Source of truth

- `STATUS.md` is the canonical project snapshot. The `.githooks/pre-commit`
  hook regenerates the auto sections on every commit — never edit them
  by hand. Run `npm run status` to refresh manually.
- `package.json` scripts: `dev`, `build`, `start`, `lint`, `typecheck`,
  `status`. Use `typecheck` + `build` to validate changes; there is no
  test runner yet.

## Branching

- `main` is owner-only. **Never** push to `main`.
- Long-lived feature branches under `claude/<topic>` are session-scoped.
  Don't push to a branch belonging to another session.
- This repo has parallel sessions running on different feature
  branches at the same time. Confirm your branch with `git branch
  --show-current` before working.

## Stack guarantees (don't fight them)

- Next.js 16 App Router, React 19, Turbopack. All routes under
  `app/[locale]/` use `next-intl 4` with `as-needed` locale prefix.
- Auth + DB: Supabase (project `ohjhnovjchwaqamgoqcf`). RLS on every
  public table.
- The `(app)` layout is the auth wall: redirects to `/login` when
  anonymous, `/banned` when banned, `/onboarding` when no
  `home_location`. Don't re-implement this in child pages.

## Design system

- Tokens live in `tailwind.config.ts` and `lib/design/colors.ts`.
- **No hex literals in code**. If you need a colour outside Tailwind
  classes (Leaflet HTML strings, recharts `stroke`, dynamic `style`),
  import from `lib/design/colors.ts`.
- Reusable primitives are in `components/ui/{Btn,IconBtn,Sheet,Chip,
  Badge}` and `components/auth/AuthForm`. Add a new primitive only
  when the same pattern appears ≥3 times.

## Server data flow

- Reads: `lib/<domain>/queries.ts` (RLS, anon client from
  `lib/supabase/server.ts`).
- Writes: `lib/<domain>/actions.ts` with `"use server"`. Verify
  `auth.uid()` first.
- For admin: every server action calls `requireAdmin()` from
  `lib/admin/guards.ts` before touching anything. Mutations log to
  `audit_log` via `recordAudit()`.
- The service-role client (`lib/supabase/admin.ts`) is `import
  "server-only"` and may only be imported from
  `app/[locale]/(app)/admin/**` and `lib/admin/**`. Never import it
  client-side or from any other route segment.

## Admin module

- Route segment: `app/[locale]/(app)/admin/{dashboard,usuarios,
  auditoria}` — entry point at `/admin` redirects to `/admin/dashboard`.
- Surfaces only when `profiles.is_admin = true`:
  - `components/admin/AdminLink.tsx` on `/perfil`
  - "Admin" item on `SideNav` (md+; the mobile `BottomNav` does not
    show it — admins enter via perfil)
- The seed admin is `christianferbol@gmail.com` (promoted in
  migration `0015_admin_role_and_ban`).
- Banning is a soft-ban: `banned_at` + `ban_reason`. The action also
  calls `auth.admin.signOut(id)` to drop active sessions. Hard delete
  via `deleteUser` exists but is not exposed in UI (GDPR-only,
  manual).
- Analytics: `lib/analytics/track.ts` is the server action; the
  client tracker is mounted inside `NotificationsRoot`. Business
  events (message_sent, meeting_*, rating_submitted,
  sticker_changed, favorite_*) are captured by SQL triggers — do
  not duplicate them in app code.

## Migrations

- Apply via the Supabase MCP `apply_migration` tool. `name` is
  `snake_case`, prefixed with the next sequence (`0021_…`).
- Internal trigger helpers (`_on_*`, `_record_event`,
  `_audit_profile_change`, `_prune_old_events`) revoke EXECUTE from
  `anon` and `authenticated`. Public RPCs gated by `is_admin()` keep
  EXECUTE for `authenticated` (the function itself enforces the
  check).

## Forbidden / coordinate first

These files belong to the parallel "PWA design" session. Do **not**
edit. Document required changes in `ADMIN_BLOCKED.md` instead:

- `app/[locale]/(app)/{album,mapa,chat,match,favoritos,onboarding}/**`
- `components/{chat,map,cromo,notifications,profile,match,moderation,
  Logo,HtmlLang,ServiceWorkerRegistrar}/**`
- `hooks/{useNearbyUsers,useCollection,useFavorites,useDeviceLocation}`
- `lib/{chat,push,profile,matches,map,data,moderation}/**`
- `tailwind.config.ts`, `lib/design/colors.ts`, `app/globals.css`
  (additive only, prefix new admin classes with `cromio-admin-`)
- `app/layout.tsx`, `app/[locale]/layout.tsx`,
  `app/[locale]/(app)/layout.tsx`, `app/[locale]/(auth)/layout.tsx`
- `proxy.ts`, `app/auth/callback/route.ts`,
  `app/tiles/[z]/[x]/[y]/route.ts`
- `public/cromio_bg.png`, `public/sw.js`, `public/offline.html`,
  `components/Logo.tsx`

Editable but **minimal** changes only (admin link / nav entry):
`app/[locale]/(app)/perfil/page.tsx`, `components/SideNav.tsx`.

## House style

- No comments unless the *why* is non-obvious. No long docstrings.
- No defensive validation for impossible cases. Trust framework
  guarantees.
- Edit existing files instead of creating new ones; keep the file
  tree small.
- Use `Edit`/`Write` tools, not `cat`/`sed`. Use `Read` before any
  edit (the harness requires it).
- Toasts: `pushAppToast` from `lib/notifications/toast.ts`.
- i18n: keys in `messages/{es,en}.json`. Use `useTranslations` /
  `getTranslations`.

## Operational

- After implementing a change set, run `npm run build` (with stub env
  vars if local Supabase isn't reachable):
  ```
  SUPABASE_SERVICE_ROLE_KEY=stub \
  NEXT_PUBLIC_SUPABASE_URL=https://stub.supabase.co \
  NEXT_PUBLIC_SUPABASE_ANON_KEY=stub \
  npm run build
  ```
- Each phase / cohesive change set ships as one conventional commit
  (`feat(admin): …`, `feat(analytics): …`, `refactor(admin): …`).
- Push with `git push -u origin <branch>`. Do **not** create PRs
  unless the user asks.
