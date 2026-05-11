import "server-only";
import { requireAdmin } from "@/lib/admin/guards";
import { createAdminClient } from "@/lib/supabase/admin";

export type Range = "24h" | "7d" | "30d" | "90d" | "all";

const TIME_KINDS = [
  "page_view",
  "session_start",
  "signup_done",
  "message_sent",
  "meeting_completed",
] as const;

export function rangeBounds(range: Range): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  switch (range) {
    case "24h":
      from.setUTCHours(from.getUTCHours() - 24);
      break;
    case "7d":
      from.setUTCDate(from.getUTCDate() - 7);
      break;
    case "30d":
      from.setUTCDate(from.getUTCDate() - 30);
      break;
    case "90d":
      from.setUTCDate(from.getUTCDate() - 90);
      break;
    case "all":
      from.setUTCFullYear(2000, 0, 1);
      break;
  }
  return { from, to };
}

export type Kpis = {
  totalUsers: number;
  dau: number;
  wau: number;
  mau: number;
  completedTrades: number;
  avgRating: number | null;
  pushOptInPct: number;
  openReports: number;
};

export type DailyPoint = {
  day: string;
  page_view?: number;
  session_start?: number;
  signup_done?: number;
  message_sent?: number;
  meeting_completed?: number;
};

export type RetentionRow = {
  cohort: string;
  day_offset: number;
  cohort_size: number;
  retained: number;
};

export type DashboardPayload = {
  range: Range;
  kpis: Kpis;
  daily: DailyPoint[];
  countries: { country: string; count: number }[];
  devices: { device: string; is_pwa: boolean; count: number }[];
  funnel: { step: string; users: number }[];
  topWanted: { sticker_n: number; users_missing: number }[];
  topSpare: { sticker_n: number; spare_total: number; users_with_spare: number }[];
  radii: { bucket: string; count: number }[];
  ratings: { stars: number; count: number }[];
  retention: RetentionRow[];
};

export async function loadDashboard(range: Range): Promise<DashboardPayload> {
  await requireAdmin();
  const admin = createAdminClient();
  const { from, to } = rangeBounds(range);
  const fromIso = from.toISOString();
  const toIso = to.toISOString();

  const [
    totalUsersRes,
    activeRes,
    completedTradesRes,
    avgRatingRes,
    pushUsersRes,
    openReportsRes,
    dailyRes,
    countriesRes,
    devicesRes,
    funnelRes,
    wantedRes,
    spareRes,
    radiiRes,
    ratingsRes,
    retentionRes,
  ] = await Promise.all([
    admin.from("profiles").select("id", { head: true, count: "exact" }),
    admin.rpc("admin_active_users"),
    // "Completed trades" is now closed trade_requests (status='done').
    admin
      .from("trade_requests")
      .select("id", { head: true, count: "exact" })
      .eq("status", "done")
      .gte("created_at", fromIso)
      .lt("created_at", toIso),
    // Ratings were removed with the meeting/rating flow. Keep the slot in
    // the destructure so the rest of the destructure positions stay valid;
    // it just always returns empty data now.
    Promise.resolve({ data: [] as { stars: number }[], error: null }),
    admin
      .from("push_subscriptions")
      .select("user_id"),
    admin
      .from("user_reports")
      .select("id", { head: true, count: "exact" })
      .neq("status", "resolved"),
    admin.rpc("admin_events_daily", {
      p_kinds: TIME_KINDS as unknown as string[],
      p_from: fromIso,
      p_to: toIso,
    }),
    admin.rpc("admin_top_countries", {
      p_from: fromIso,
      p_to: toIso,
      p_limit: 10,
    }),
    admin.rpc("admin_device_breakdown", { p_from: fromIso, p_to: toIso }),
    admin.rpc("admin_funnel", { p_from: fromIso, p_to: toIso }),
    admin.rpc("admin_top_wanted", { p_limit: 20 }),
    admin.rpc("admin_top_spare", { p_limit: 20 }),
    admin.rpc("admin_radii_histogram"),
    // admin_ratings_histogram backed chat_ratings — table is gone now.
    Promise.resolve({ data: [] as { stars: number; count: number }[], error: null }),
    admin.rpc("admin_retention_cohort", { p_from: fromIso, p_to: toIso }),
  ]);

  const totalUsers = totalUsersRes.count ?? 0;
  const dauRow = (activeRes.data?.[0] as { dau: number; wau: number; mau: number } | undefined);
  const dau = Number(dauRow?.dau ?? 0);
  const wau = Number(dauRow?.wau ?? 0);
  const mau = Number(dauRow?.mau ?? 0);

  const ratings = (avgRatingRes.data ?? []) as { stars: number }[];
  const avgRating = ratings.length
    ? ratings.reduce((a, r) => a + (r.stars ?? 0), 0) / ratings.length
    : null;

  const pushUserSet = new Set(
    ((pushUsersRes.data ?? []) as { user_id: string }[]).map((r) => r.user_id),
  );
  const pushOptInPct = totalUsers > 0 ? (pushUserSet.size / totalUsers) * 100 : 0;

  type DailyRow = { day: string; kind: string; count: number };
  const byDay = new Map<string, DailyPoint>();
  for (const row of (dailyRes.data ?? []) as DailyRow[]) {
    const day = row.day;
    if (!byDay.has(day)) byDay.set(day, { day });
    const entry = byDay.get(day)!;
    (entry as Record<string, unknown>)[row.kind] = Number(row.count);
  }
  const daily = Array.from(byDay.values()).sort((a, b) =>
    a.day.localeCompare(b.day),
  );

  const countries = ((countriesRes.data ?? []) as { country: string; count: number }[]).map(
    (r) => ({ country: r.country, count: Number(r.count) }),
  );
  const devices = (
    (devicesRes.data ?? []) as { device: string; is_pwa: boolean; count: number }[]
  ).map((r) => ({ device: r.device, is_pwa: r.is_pwa, count: Number(r.count) }));
  const funnel = ((funnelRes.data ?? []) as { step: string; users: number }[]).map(
    (r) => ({ step: r.step, users: Number(r.users) }),
  );
  const topWanted = (
    (wantedRes.data ?? []) as { sticker_n: number; users_missing: number }[]
  ).map((r) => ({ sticker_n: r.sticker_n, users_missing: Number(r.users_missing) }));
  const topSpare = (
    (spareRes.data ?? []) as {
      sticker_n: number;
      spare_total: number;
      users_with_spare: number;
    }[]
  ).map((r) => ({
    sticker_n: r.sticker_n,
    spare_total: Number(r.spare_total),
    users_with_spare: Number(r.users_with_spare),
  }));
  const radii = ((radiiRes.data ?? []) as { bucket: string; count: number }[]).map(
    (r) => ({ bucket: r.bucket, count: Number(r.count) }),
  );
  const ratingsHist = (
    (ratingsRes.data ?? []) as { stars: number; count: number }[]
  ).map((r) => ({ stars: r.stars, count: Number(r.count) }));
  const retention = (
    (retentionRes.data ?? []) as {
      cohort: string;
      day_offset: number;
      cohort_size: number;
      retained: number;
    }[]
  ).map((r) => ({
    cohort: r.cohort,
    day_offset: Number(r.day_offset),
    cohort_size: Number(r.cohort_size),
    retained: Number(r.retained),
  }));

  return {
    range,
    kpis: {
      totalUsers,
      dau,
      wau,
      mau,
      completedTrades: completedTradesRes.count ?? 0,
      avgRating,
      pushOptInPct,
      openReports: openReportsRes.count ?? 0,
    },
    daily,
    countries,
    devices,
    funnel,
    topWanted,
    topSpare,
    radii,
    ratings: ratingsHist,
    retention,
  };
}
