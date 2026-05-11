"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAudit } from "@/lib/admin/audit";

export type UserRow = {
  id: string;
  alias: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  color: string | null;
  plan: string | null;
  rating: number | null;
  trades_count: number | null;
  is_admin: boolean;
  is_online: boolean | null;
  banned_at: string | null;
  ban_reason: string | null;
  has_location: boolean;
  created_at: string;
  last_event_at: string | null;
};

export type UserListResult = {
  rows: UserRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type UserListParams = {
  search?: string;
  plan?: "any" | "free" | "pro";
  status?: "any" | "active" | "banned";
  location?: "any" | "has" | "missing";
  adminsOnly?: boolean;
  sort?: "createdAt" | "lastActivity" | "rating" | "tradesCount";
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

const PAGE_SIZE_DEFAULT = 25;

export async function listUsers(
  params: UserListParams,
): Promise<UserListResult> {
  await requireAdmin();
  const admin = createAdminClient();

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? PAGE_SIZE_DEFAULT));
  const sort = params.sort ?? "createdAt";
  const dir = params.dir ?? "desc";

  let query = admin
    .from("profiles")
    .select(
      "id, alias, display_name, avatar_url, color, plan, rating, trades_count, is_admin, is_online, banned_at, ban_reason, home_location, created_at",
      { count: "exact" },
    );

  if (params.adminsOnly) query = query.eq("is_admin", true);
  if (params.plan && params.plan !== "any") query = query.eq("plan", params.plan);
  if (params.status === "banned") query = query.not("banned_at", "is", null);
  if (params.status === "active") query = query.is("banned_at", null);
  if (params.location === "has") query = query.not("home_location", "is", null);
  if (params.location === "missing") query = query.is("home_location", null);

  if (params.search?.trim()) {
    const term = params.search.trim().replace(/[%_]/g, "\\$&");
    query = query.or(
      `alias.ilike.%${term}%,display_name.ilike.%${term}%`,
    );
  }

  const sortCol =
    sort === "rating"
      ? "rating"
      : sort === "tradesCount"
        ? "trades_count"
        : "created_at";
  query = query.order(sortCol, { ascending: dir === "asc", nullsFirst: false });
  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const ids = (data ?? []).map((r) => r.id);

  // Fetch emails in batch from auth.admin.listUsers — too coarse. Use direct query.
  type AuthRow = { id: string; email: string | null };
  let emailById = new Map<string, string | null>();
  if (ids.length > 0) {
    const { data: authRows } = await admin
      .schema("auth")
      .from("users")
      .select("id, email")
      .in("id", ids);
    emailById = new Map(((authRows ?? []) as AuthRow[]).map((r) => [r.id, r.email]));
  }

  // Last activity from events
  const lastEventById = new Map<string, string>();
  if (ids.length > 0) {
    const { data: ev } = await admin
      .from("events")
      .select("user_id, created_at")
      .in("user_id", ids)
      .order("created_at", { ascending: false })
      .limit(ids.length * 10);
    for (const row of ev ?? []) {
      const r = row as { user_id: string | null; created_at: string };
      if (!r.user_id) continue;
      if (!lastEventById.has(r.user_id)) {
        lastEventById.set(r.user_id, r.created_at);
      }
    }
  }

  const rows: UserRow[] = (data ?? []).map((r) => ({
    id: r.id,
    alias: r.alias,
    display_name: r.display_name ?? null,
    email: emailById.get(r.id) ?? null,
    avatar_url: r.avatar_url ?? null,
    color: r.color ?? null,
    plan: r.plan ?? null,
    rating: r.rating ?? null,
    trades_count: r.trades_count ?? 0,
    is_admin: Boolean(r.is_admin),
    is_online: r.is_online ?? null,
    banned_at: r.banned_at ?? null,
    ban_reason: r.ban_reason ?? null,
    has_location: Boolean(r.home_location),
    created_at: r.created_at as string,
    last_event_at: lastEventById.get(r.id) ?? null,
  }));

  if (sort === "lastActivity") {
    rows.sort((a, b) => {
      const av = a.last_event_at ?? "";
      const bv = b.last_event_at ?? "";
      return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  return { rows, total: count ?? rows.length, page, pageSize };
}

export type UserDetail = UserRow & {
  bio: string | null;
  locale: string | null;
  search_radius_m: number | null;
  sticker_count: number;
  unique_stickers: number;
  duplicates: number;
  messages_sent: number;
  chats_count: number;
  completed_trades: number;
  open_reports: number;
};

export async function getUserDetail(id: string): Promise<UserDetail | null> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select(
      "id, alias, display_name, bio, avatar_url, color, plan, rating, trades_count, is_admin, is_online, banned_at, ban_reason, home_location, locale, search_radius_m, created_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!profile) return null;

  const { data: authRow } = await admin
    .schema("auth")
    .from("users")
    .select("id, email")
    .eq("id", id)
    .maybeSingle();

  const [{ data: stickerRows }, { count: msgs }, { count: chats }, { count: reports }, { data: lastEv }] =
    await Promise.all([
      admin.from("user_stickers").select("count").eq("user_id", id),
      admin
        .from("messages")
        .select("id", { head: true, count: "exact" })
        .eq("sender_id", id),
      admin
        .from("chats")
        .select("id", { head: true, count: "exact" })
        .or(`user_a.eq.${id},user_b.eq.${id}`),
      admin
        .from("user_reports")
        .select("id", { head: true, count: "exact" })
        .eq("reported_id", id)
        .neq("status", "resolved"),
      admin
        .from("events")
        .select("created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

  let unique = 0;
  let duplicates = 0;
  for (const row of stickerRows ?? []) {
    const c = (row as { count: number }).count ?? 0;
    if (c >= 1) unique++;
    if (c >= 2) duplicates += c - 1;
  }

  return {
    id: profile.id,
    alias: profile.alias,
    display_name: profile.display_name ?? null,
    email: authRow?.email ?? null,
    avatar_url: profile.avatar_url ?? null,
    color: profile.color ?? null,
    plan: profile.plan ?? null,
    rating: profile.rating ?? null,
    trades_count: profile.trades_count ?? 0,
    is_admin: Boolean(profile.is_admin),
    is_online: profile.is_online ?? null,
    banned_at: profile.banned_at ?? null,
    ban_reason: profile.ban_reason ?? null,
    has_location: Boolean(profile.home_location),
    created_at: profile.created_at as string,
    last_event_at: (lastEv?.[0]?.created_at as string | undefined) ?? null,
    bio: profile.bio ?? null,
    locale: profile.locale ?? null,
    search_radius_m: profile.search_radius_m ?? null,
    sticker_count: unique,
    unique_stickers: unique,
    duplicates,
    messages_sent: msgs ?? 0,
    chats_count: chats ?? 0,
    completed_trades: profile.trades_count ?? 0,
    open_reports: reports ?? 0,
  };
}

type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateUser(
  id: string,
  patch: {
    alias?: string;
    display_name?: string | null;
    color?: string | null;
    plan?: string;
    bio?: string | null;
  },
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  const admin = createAdminClient();
  const { data: before } = await admin
    .from("profiles")
    .select("alias, display_name, color, plan, bio")
    .eq("id", id)
    .maybeSingle();

  const { error } = await admin.from("profiles").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await recordAudit({
    actorId: ctx.userId,
    action: "user.update",
    targetUserId: id,
    before,
    after: patch,
  });
  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${id}`);
  return { ok: true };
}

export async function banUser(
  id: string,
  reason: string,
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (ctx.userId === id) return { ok: false, error: "selfBan" };
  const trimmed = reason.trim().slice(0, 500);
  if (!trimmed) return { ok: false, error: "Ban reason required" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ banned_at: new Date().toISOString(), ban_reason: trimmed })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  // Drop sessions immediately
  await admin.auth.admin.signOut(id).catch(() => {});

  await recordAudit({
    actorId: ctx.userId,
    action: "user.ban",
    targetUserId: id,
    after: { reason: trimmed },
  });
  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${id}`);
  return { ok: true };
}

export async function unbanUser(id: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ banned_at: null, ban_reason: null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await recordAudit({
    actorId: ctx.userId,
    action: "user.unban",
    targetUserId: id,
  });
  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${id}`);
  return { ok: true };
}

export async function forceSignOut(id: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.signOut(id);
  if (error) return { ok: false, error: error.message };
  await recordAudit({
    actorId: ctx.userId,
    action: "user.force_sign_out",
    targetUserId: id,
  });
  return { ok: true };
}

export async function sendPasswordReset(id: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  const admin = createAdminClient();
  const { data: u } = await admin.auth.admin.getUserById(id);
  const email = u?.user?.email;
  if (!email) return { ok: false, error: "User has no email" };

  const { error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
  });
  if (error) return { ok: false, error: error.message };

  await recordAudit({
    actorId: ctx.userId,
    action: "user.password_reset",
    targetUserId: id,
  });
  return { ok: true };
}

export async function setAdminFlag(
  id: string,
  isAdmin: boolean,
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (ctx.userId === id && !isAdmin) {
    return { ok: false, error: "selfDemote" };
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ is_admin: isAdmin })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await recordAudit({
    actorId: ctx.userId,
    action: isAdmin ? "user.promote_admin" : "user.demote_admin",
    targetUserId: id,
  });
  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${id}`);
  return { ok: true };
}

// Hard delete — service-role + auth.admin.deleteUser. Cascades through
// every FK on auth.users.id (profiles, user_stickers, chats, messages,
// etc.). Irreversible; the GDPR export action is the only safety net.
export async function deleteUser(id: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (ctx.userId === id) return { ok: false, error: "selfDelete" };
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { ok: false, error: error.message };
  await recordAudit({
    actorId: ctx.userId,
    action: "user.delete",
    targetUserId: id,
  });
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function exportUserData(id: string): Promise<
  ActionResult & { data?: Record<string, unknown> }
> {
  const ctx = await requireAdmin();
  const admin = createAdminClient();
  const [profile, stickers, chats, messages, trades, favs, events, reports, blocks, pushSubs] =
    await Promise.all([
      admin.from("profiles").select("*").eq("id", id).maybeSingle(),
      admin.from("user_stickers").select("*").eq("user_id", id),
      admin
        .from("chats")
        .select("*")
        .or(`user_a.eq.${id},user_b.eq.${id}`),
      admin.from("messages").select("*").eq("sender_id", id),
      admin
        .from("trade_requests")
        .select("*")
        .or(`from_user_id.eq.${id},to_user_id.eq.${id}`),
      admin.from("user_favorites").select("*").eq("user_id", id),
      admin.from("events").select("*").eq("user_id", id),
      admin.from("user_reports").select("*").eq("reporter_id", id),
      admin.from("user_blocks").select("*").eq("blocker_id", id),
      admin.from("push_subscriptions").select("*").eq("user_id", id),
    ]);

  await recordAudit({
    actorId: ctx.userId,
    action: "user.export",
    targetUserId: id,
  });

  return {
    ok: true,
    data: {
      generated_at: new Date().toISOString(),
      user_id: id,
      profile: profile.data,
      user_stickers: stickers.data,
      chats: chats.data,
      messages: messages.data,
      trade_requests: trades.data,
      user_favorites: favs.data,
      events: events.data,
      user_reports: reports.data,
      user_blocks: blocks.data,
      push_subscriptions: pushSubs.data,
    },
  };
}
