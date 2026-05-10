import { createClient } from "@/lib/supabase/server";
import { TOTAL_STICKERS } from "@/lib/data/stickers";

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
  other_completion_pct: number;
  you_get_count: number;
  they_get_count: number;
};

export async function loadChatsForCurrentUser(): Promise<ChatRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data: chatsRaw }, { data: blocks }] = await Promise.all([
    supabase
      .from("chats")
      .select(
        `id, state, last_message_at, created_at, user_a, user_b,
         a:profiles!chats_user_a_fkey (id, alias, display_name, avatar_url, color),
         b:profiles!chats_user_b_fkey (id, alias, display_name, avatar_url, color)`,
      )
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order("last_message_at", { ascending: false, nullsFirst: false }),
    supabase
      .from("user_blocks")
      .select("blocked_id")
      .eq("blocker_id", user.id),
  ]);

  if (!chatsRaw || chatsRaw.length === 0) return [];

  const blockedIds = new Set((blocks ?? []).map((b) => b.blocked_id));
  const chats = chatsRaw.filter((c) => {
    const other = c.user_a === user.id ? c.user_b : c.user_a;
    return !blockedIds.has(other);
  });

  if (chats.length === 0) return [];

  const ids = chats.map((c) => c.id);
  const otherIds = chats.map((c) => (c.user_a === user.id ? c.user_b : c.user_a));

  const [{ data: lastMessages }, { data: unread }, { data: myStickers }, { data: otherStickers }] =
    await Promise.all([
      supabase
        .from("messages")
        .select("chat_id, sender_id, body, created_at")
        .in("chat_id", ids)
        .order("created_at", { ascending: false }),
      supabase
        .from("messages")
        .select("chat_id")
        .in("chat_id", ids)
        .neq("sender_id", user.id)
        .is("read_by_recipient_at", null),
      supabase.from("user_stickers").select("sticker_n, count").eq("user_id", user.id),
      supabase
        .from("user_stickers")
        .select("user_id, sticker_n, count")
        .in("user_id", otherIds),
    ]);

  const lastByChat = new Map<string, NonNullable<ChatRow["last_message"]> & { chat_id: string }>();
  for (const m of lastMessages ?? []) {
    if (!lastByChat.has(m.chat_id)) lastByChat.set(m.chat_id, m as never);
  }

  const unreadByChat = new Map<string, number>();
  for (const m of unread ?? []) {
    unreadByChat.set(m.chat_id, (unreadByChat.get(m.chat_id) ?? 0) + 1);
  }

  const myCol = new Map<number, number>();
  for (const s of myStickers ?? []) myCol.set(s.sticker_n, s.count);

  const colByUser = new Map<string, Map<number, number>>();
  for (const s of otherStickers ?? []) {
    let m = colByUser.get(s.user_id);
    if (!m) {
      m = new Map();
      colByUser.set(s.user_id, m);
    }
    m.set(s.sticker_n, s.count);
  }

  return chats.map((c) => {
    const otherRaw = (c.user_a === user.id ? c.b : c.a) as ChatRow["other_user"] | ChatRow["other_user"][];
    const other = Array.isArray(otherRaw) ? otherRaw[0] : otherRaw;
    const last = lastByChat.get(c.id);

    const theirCol = colByUser.get(other.id) ?? new Map<number, number>();
    let otherUnique = 0;
    let youGet = 0;
    let theyGet = 0;
    for (let n = 1; n <= TOTAL_STICKERS; n++) {
      const mine = myCol.get(n) ?? 0;
      const theirs = theirCol.get(n) ?? 0;
      if (theirs >= 1) otherUnique++;
      if (mine === 0 && theirs >= 2) youGet++;
      if (mine >= 2 && theirs === 0) theyGet++;
    }
    const otherCompletionPct = Math.round((otherUnique / TOTAL_STICKERS) * 100);

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
      other_completion_pct: otherCompletionPct,
      you_get_count: youGet,
      they_get_count: theyGet,
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

export type ChatState = "pending" | "confirmed" | "completed" | "cancelled";

export type ChatMeeting = {
  place: string;
  at: string;
  proposer_id: string;
} | null;

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
       meeting_place, meeting_at, meeting_proposer_id,
       a:profiles!chats_user_a_fkey (id, alias, display_name, avatar_url, color, rating, trades_count),
       b:profiles!chats_user_b_fkey (id, alias, display_name, avatar_url, color, rating, trades_count)`,
    )
    .eq("id", chatId)
    .maybeSingle();

  if (!chat) return null;

  const otherRaw = (chat.user_a === user.id ? chat.b : chat.a) as never;
  const other = Array.isArray(otherRaw) ? otherRaw[0] : otherRaw;

  const [{ data: messages }, { data: myRating }] = await Promise.all([
    supabase
      .from("messages")
      .select("id, chat_id, sender_id, body, created_at, read_by_recipient_at")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true }),
    supabase
      .from("chat_ratings")
      .select("stars")
      .eq("chat_id", chatId)
      .eq("rater_id", user.id)
      .maybeSingle(),
  ]);

  const meeting: ChatMeeting = chat.meeting_at
    ? {
        place: chat.meeting_place ?? "",
        at: chat.meeting_at,
        proposer_id: chat.meeting_proposer_id ?? "",
      }
    : null;

  return {
    chat: { id: chat.id, state: chat.state as ChatState },
    me: user.id,
    other,
    meeting,
    myRated: !!myRating,
    messages: (messages ?? []) as ChatMessage[],
  };
}
