"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push/server";

export async function startChatWith(userId: string) {
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
  redirect(`/chat/${data}`);
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
