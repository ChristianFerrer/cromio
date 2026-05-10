import "server-only";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "./server";

const RADIUS_M = 5000;
const COOLDOWN_HOURS = 24;

type Recipient = {
  recipient_id: string;
  recipient_alias: string;
  recipient_display_name: string | null;
  distance_m: number;
  you_get_count: number;
  they_get_count: number;
};

// Find users who became a "match" with the acting user and haven't been notified
// in the cooldown window, push to each, and mark them as notified.
// Fire-and-forget from the call site — never throws to the caller.
export async function notifyNewNearbyMatches(actingUserId: string) {
  try {
    const supabase = await createClient();

    const { data: actor } = await supabase
      .from("profiles")
      .select("alias, display_name")
      .eq("id", actingUserId)
      .maybeSingle();
    const actorName = actor?.display_name || actor?.alias || "Un coleccionista";

    const { data, error } = await supabase.rpc("find_new_nearby_matches_to_push", {
      p_acting_user_id: actingUserId,
      p_radius_m: RADIUS_M,
      p_cooldown_hours: COOLDOWN_HOURS,
    });
    if (error) {
      console.error("[cromio] find_new_nearby_matches_to_push failed:", error);
      return;
    }
    const recipients = (data ?? []) as Recipient[];
    if (recipients.length === 0) return;

    await Promise.all(
      recipients.map((r) =>
        sendPushToUser(r.recipient_id, {
          title: "Nuevo match cerca",
          body: `${actorName} tiene cromos para intercambiar contigo.`,
          url: `/match/${actingUserId}`,
          tag: `match-${actingUserId}`,
        }),
      ),
    );

    await supabase.rpc("mark_nearby_pushed", {
      p_acting_user_id: actingUserId,
      p_recipient_ids: recipients.map((r) => r.recipient_id),
    });
  } catch (err) {
    console.error("[cromio] notifyNewNearbyMatches failed:", err);
  }
}
