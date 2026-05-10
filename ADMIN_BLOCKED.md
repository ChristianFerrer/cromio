# Admin module — required edits to blocked files

The admin module needs the following changes in files that the working
brief lists as off-limits. They are documented here for the owner of the
parallel session / branch to apply.

## 1. Ban gate in the (app) layout

**File**: `app/[locale]/(app)/layout.tsx`

After loading `profile` (same query that already pulls `home_location`)
also select `banned_at` and redirect to `/banned` when present:

```ts
const { data: profile } = await supabase
  .from("profiles")
  .select("home_location, banned_at")
  .eq("id", user.id)
  .maybeSingle();
if (profile?.banned_at) redirect("/banned");
if (!profile?.home_location) redirect("/onboarding");
```

Without this gate a banned user can still load `/album` etc. — the
admin UI can mark them banned but the rest of the app does not enforce
it client-side. RLS on `messages`, `chats`, etc. should *also* be
hardened in a later pass, but the layout redirect is the cheap fix.

## 2. PageViewTracker mount point

`PageViewTracker` is mounted inside `NotificationsRoot` (which is a
client component). That file is on the editable list, so no action is
required from the parallel session.

## 3. Hard delete (GDPR)

`deleteUser` server action exists in `lib/admin/users.ts` and uses the
service-role client, but is **not** exposed in any UI. To honour a
GDPR erasure request the admin must invoke it manually from a server
context or a future scripted runbook.
