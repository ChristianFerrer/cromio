"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push/server";

export async function startChatWith(userId: string, draftQuery?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.rpc("get_or_create_chat", {
    p_other_user_id: userId,
  });

  if (error || !data) {
    return { error: error?.message ?? "Could not create chat" };
  }
  const url = draftQuery ? `/chat/${data}?${draftQuery}` : `/chat/${data}`;
  redirect(url);
}

export async function sendMessage(chatId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) return { error: "empty" };
  if (trimmed.length > 2000) return { error: "too_long" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not_authenticated" };

  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    sender_id: user.id,
    body: trimmed,
  });

  if (error) return { error: error.message };

  // Find the recipient and send a Web Push notification.
  const { data: chat } = await supabase
    .from("chats")
    .select("user_a, user_b")
    .eq("id", chatId)
    .maybeSingle();
  if (chat) {
    const recipient = chat.user_a === user.id ? chat.user_b : chat.user_a;
    const { data: me } = await supabase
      .from("profiles")
      .select("alias, display_name")
      .eq("id", user.id)
      .maybeSingle();
    const senderName = me?.display_name || me?.alias || "Coleccionista";
    void sendPushToUser(recipient, {
      title: senderName,
      body: trimmed.length > 120 ? `${trimmed.slice(0, 117)}…` : trimmed,
      url: `/chat/${chatId}`,
      tag: `chat-${chatId}`,
    });
  }

  revalidatePath(`/chat/${chatId}`);
  revalidatePath("/chat");
  return { ok: true };
}

export async function markChatRead(chatId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("messages")
    .update({ read_by_recipient_at: new Date().toISOString() })
    .eq("chat_id", chatId)
    .neq("sender_id", user.id)
    .is("read_by_recipient_at", null);
}

async function getRecipient(chatId: string, meId: string) {
  const supabase = await createClient();
  const { data: chat } = await supabase
    .from("chats")
    .select("user_a, user_b")
    .eq("id", chatId)
    .maybeSingle();
  if (!chat) return null;
  return chat.user_a === meId ? chat.user_b : chat.user_a;
}

async function senderAlias(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("alias, display_name")
    .eq("id", userId)
    .maybeSingle();
  return data?.display_name || data?.alias || "Coleccionista";
}

export async function proposeMeeting(
  chatId: string,
  place: string,
  whenIso: string,
) {
  const trimmedPlace = place.trim();
  if (!trimmedPlace || trimmedPlace.length > 200) return { error: "invalid_place" };
  const dt = new Date(whenIso);
  if (Number.isNaN(dt.getTime())) return { error: "invalid_time" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };

  const { error } = await supabase
    .from("chats")
    .update({
      state: "pending",
      meeting_place: trimmedPlace,
      meeting_at: dt.toISOString(),
      meeting_proposer_id: user.id,
    })
    .eq("id", chatId);
  if (error) return { error: error.message };

  const recipient = await getRecipient(chatId, user.id);
  if (recipient) {
    const name = await senderAlias(user.id);
    void sendPushToUser(recipient, {
      title: "Propuesta de quedada",
      body: `${name} propone ${trimmedPlace} · ${dt.toLocaleString("es-ES")}`,
      url: `/chat/${chatId}`,
      tag: `chat-${chatId}`,
    });
  }

  revalidatePath(`/chat/${chatId}`);
  return { ok: true };
}

export async function respondToMeeting(chatId: string, accept: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };

  const { data: chat } = await supabase
    .from("chats")
    .select("user_a, user_b, meeting_proposer_id, state")
    .eq("id", chatId)
    .maybeSingle();
  if (!chat) return { error: "not_found" };
  if (chat.meeting_proposer_id === user.id) return { error: "cannot_self_respond" };

  const newState = accept ? "confirmed" : "cancelled";
  const update = accept
    ? { state: newState }
    : {
        state: newState,
        meeting_place: null,
        meeting_at: null,
        meeting_proposer_id: null,
      };

  const { error } = await supabase.from("chats").update(update).eq("id", chatId);
  if (error) return { error: error.message };

  if (chat.meeting_proposer_id) {
    const name = await senderAlias(user.id);
    void sendPushToUser(chat.meeting_proposer_id, {
      title: accept ? "Quedada confirmada" : "Quedada rechazada",
      body: `${name} ${accept ? "ha confirmado" : "no puede"} la quedada.`,
      url: `/chat/${chatId}`,
      tag: `chat-${chatId}`,
    });
  }

  revalidatePath(`/chat/${chatId}`);
  return { ok: true };
}

export async function completeMeeting(chatId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };

  const { error } = await supabase
    .from("chats")
    .update({ state: "completed" })
    .eq("id", chatId);
  if (error) return { error: error.message };
  revalidatePath(`/chat/${chatId}`);
  return { ok: true };
}

export async function rateChat(
  chatId: string,
  stars: number,
  note?: string,
) {
  if (stars < 1 || stars > 5) return { error: "invalid_stars" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };

  const { data: chat } = await supabase
    .from("chats")
    .select("user_a, user_b, state")
    .eq("id", chatId)
    .maybeSingle();
  if (!chat) return { error: "not_found" };
  if (chat.state !== "completed") return { error: "not_completed" };

  const ratee = chat.user_a === user.id ? chat.user_b : chat.user_a;

  const { error } = await supabase.from("chat_ratings").insert({
    chat_id: chatId,
    rater_id: user.id,
    ratee_id: ratee,
    stars,
    note: note?.trim().slice(0, 280) || null,
  });
  if (error) {
    if (error.code === "23505") return { error: "already_rated" };
    return { error: error.message };
  }
  revalidatePath(`/chat/${chatId}`);
  return { ok: true };
}
