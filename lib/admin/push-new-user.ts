import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let configured = false;
let warned = false;

function configure(): boolean {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:hi@cromio.app";
  if (!publicKey || !privateKey) {
    if (!warned) {
      console.warn(
        "[cromio] admin push disabled: missing VAPID env vars",
      );
      warned = true;
    }
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export async function pushNewUserToAdmins(opts: {
  newUserId: string;
  newUserEmail?: string | null;
}): Promise<void> {
  if (!configure()) return;

  try {
    const admin = createAdminClient();

    const { data: admins, error: adminsErr } = await admin
      .from("profiles")
      .select("id")
      .eq("is_admin", true)
      .neq("id", opts.newUserId);
    if (adminsErr || !admins?.length) return;

    const adminIds = admins.map((a) => a.id as string);

    const { data: subs, error: subsErr } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .in("user_id", adminIds);
    if (subsErr || !subs?.length) return;

    const who = opts.newUserEmail ?? `usuario ${opts.newUserId.slice(0, 8)}`;
    const payload = JSON.stringify({
      title: "Nuevo usuario en Cromio",
      body: `${who} se acaba de registrar.`,
      url: `/admin/usuarios/${opts.newUserId}`,
      tag: `new-user-${opts.newUserId}`,
    });

    const stale: string[] = [];
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: s.endpoint as string,
              keys: { p256dh: s.p256dh as string, auth: s.auth as string },
            },
            payload,
            { TTL: 60 * 60 * 24 },
          );
        } catch (err: unknown) {
          const status =
            typeof err === "object" && err && "statusCode" in err
              ? Number((err as { statusCode?: number }).statusCode)
              : 0;
          if (status === 404 || status === 410) stale.push(s.id as string);
          else console.error("[cromio] admin push send failed:", err);
        }
      }),
    );

    if (stale.length > 0) {
      await admin.from("push_subscriptions").delete().in("id", stale);
    }
  } catch (err) {
    console.error("[cromio] pushNewUserToAdmins failed:", err);
  }
}
