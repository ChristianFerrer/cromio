import { createClient } from "@/lib/supabase/server";

export type ChatRow = {
  id: string;
  state: "pending" | "confirmed" | "completed" | "cancelled";
  last_message_at: string | null;
  created_at: string;
  other_user: {
    id: string;
    alias: string;
    display_name: string | null;
    avatar_url: string | null;
    color: string | null;
  };
  last_message: {
    body: string;
    sender_id: string;
    created_at: string;
  } | null;
  unread_count: number;
};

export async function loadChatsForCurrentUser(): Promise<ChatRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: chats } = await supabase
    .from("chats")
    .select(
      `id, state, last_message_at, created_at, user_a, user_b,
       a:profiles!chats_user_a_fkey (id, alias, display_name, avatar_url, color),
       b:profiles!chats_user_b_fkey (id, alias, display_name, avatar_url, color)`,
    )
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (!chats || chats.length === 0) return [];

  const ids = chats.map((c) => c.id);

  const { data: lastMessages } = await supabase
    .from("messages")
    .select("chat_id, sender_id, body, created_at")
    .in("chat_id", ids)
    .order("created_at", { ascending: false });

  const lastByChat = new Map<string, NonNullable<ChatRow["last_message"]> & { chat_id: string }>();
  for (const m of lastMessages ?? []) {
    if (!lastByChat.has(m.chat_id)) lastByChat.set(m.chat_id, m as never);
  }

  const { data: unread } = await supabase
    .from("messages")
    .select("chat_id")
    .in("chat_id", ids)
    .neq("sender_id", user.id)
    .is("read_by_recipient_at", null);

  const unreadByChat = new Map<string, number>();
  for (const m of unread ?? []) {
    unreadByChat.set(m.chat_id, (unreadByChat.get(m.chat_id) ?? 0) + 1);
  }

  return chats.map((c) => {
    const otherRaw = (c.user_a === user.id ? c.b : c.a) as ChatRow["other_user"] | ChatRow["other_user"][];
    const other = Array.isArray(otherRaw) ? otherRaw[0] : otherRaw;
    const last = lastByChat.get(c.id);
    return {
      id: c.id,
      state: c.state,
      last_message_at: c.last_message_at,
      created_at: c.created_at,
      other_user: other,
      last_message: last
        ? { body: last.body, sender_id: last.sender_id, created_at: last.created_at }
        : null,
      unread_count: unreadByChat.get(c.id) ?? 0,
    };
  });
}

export type ChatMessage = {
  id: string;
  chat_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_by_recipient_at: string | null;
};

export async function loadUnreadByChat(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data } = await supabase
    .from("messages")
    .select("chat_id")
    .neq("sender_id", user.id)
    .is("read_by_recipient_at", null);

  const out: Record<string, number> = {};
  for (const m of data ?? []) {
    out[m.chat_id] = (out[m.chat_id] ?? 0) + 1;
  }
  return out;
}

export async function loadChatDetail(chatId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: chat } = await supabase
    .from("chats")
    .select(
      `id, state, user_a, user_b,
       a:profiles!chats_user_a_fkey (id, alias, display_name, avatar_url, color, rating, trades_count),
       b:profiles!chats_user_b_fkey (id, alias, display_name, avatar_url, color, rating, trades_count)`,
    )
    .eq("id", chatId)
    .maybeSingle();

  if (!chat) return null;

  const otherRaw = (chat.user_a === user.id ? chat.b : chat.a) as never;
  const other = Array.isArray(otherRaw) ? otherRaw[0] : otherRaw;

  const { data: messages } = await supabase
    .from("messages")
    .select("id, chat_id, sender_id, body, created_at, read_by_recipient_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  return {
    chat: { id: chat.id, state: chat.state },
    me: user.id,
    other,
    messages: (messages ?? []) as ChatMessage[],
  };
}
