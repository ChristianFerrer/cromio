# Admin module — required edits to blocked files

The admin module needs the following changes in files that the working
brief lists as off-limits. They are documented here for the owner of the
parallel session / branch to apply.

## 1. Ban gate in the (app) layout (REQUIRED, blocking)

**File**: `app/[locale]/(app)/layout.tsx`

The `/banned` page now lives at `app/[locale]/(app)/banned/page.tsx`,
which means it goes through this layout. The layout must redirect
banned users to `/banned` **before** the `home_location` check,
otherwise a banned user with no location is redirected to
`/onboarding` and gets stuck.

Apply this change:

```ts
const { data: profile } = await supabase
  .from("profiles")
  .select("home_location, banned_at")
  .eq("id", user.id)
  .maybeSingle();
// Banned users get bounced to /banned, regardless of onboarding state.
if (profile?.banned_at) redirect("/banned");
if (!profile?.home_location) redirect("/onboarding");
```

The `/banned` page itself short-circuits: if `banned_at` is null when
the admin lifts a ban, it redirects to `/album`. So a one-time bounce
through `/banned` is harmless even with this redirect in place.

Without this change:
- Banned users without a stored location land on `/onboarding`.
- Banned users with a stored location land on `/album` (the ban only
  forces a sign-out via `auth.admin.signOut`; re-logging in restores
  access). They can still post messages, open chats etc.

## 2. Hard delete (GDPR)

`deleteUser` server action exists in `lib/admin/users.ts` and uses the
service-role client, but is intentionally **not** exposed in any UI.
To honour a GDPR erasure request the admin must invoke it manually
from a server context or a future scripted runbook.

## 3. Realtime publication for `events` (optional)

The dashboard polls aggregations on every load, so `events` is not
included in `supabase_realtime`. If you want the dashboard to live-
update without a refresh, add `events` to the publication and
subscribe in the dashboard page.
