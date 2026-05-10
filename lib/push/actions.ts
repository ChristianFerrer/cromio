"use server";

import { createClient } from "@/lib/supabase/server";

type SubscriptionInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
};

export async function savePushSubscription(input: SubscriptionInput) {
  if (!input?.endpoint || !input?.p256dh || !input?.auth) {
    return { error: "invalid" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        user_agent: input.userAgent ?? null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );

  if (error) return { error: error.message };
  return { ok: true };
}

export async function removePushSubscription(endpoint: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);
}
