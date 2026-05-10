import "server-only";
import { requireAdmin } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuditRow = {
  id: string;
  action: string;
  created_at: string;
  actor_id: string | null;
  actor_alias: string | null;
  target_user_id: string | null;
  target_alias: string | null;
};

export async function listRecentAudit(limit = 100): Promise<AuditRow[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("audit_log")
    .select("id, action, created_at, actor_id, target_user_id")
    .order("created_at", { ascending: false })
    .limit(limit);
  const rows = (data ?? []) as Array<{
    id: string;
    action: string;
    created_at: string;
    actor_id: string | null;
    target_user_id: string | null;
  }>;
  const ids = Array.from(
    new Set(
      rows.flatMap((r) => [r.actor_id, r.target_user_id].filter(Boolean) as string[]),
    ),
  );
  let aliasById = new Map<string, string>();
  if (ids.length > 0) {
    const { data: profs } = await admin
      .from("profiles")
      .select("id, alias")
      .in("id", ids);
    aliasById = new Map(
      ((profs ?? []) as { id: string; alias: string }[]).map((p) => [p.id, p.alias]),
    );
  }
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    created_at: r.created_at,
    actor_id: r.actor_id,
    actor_alias: r.actor_id ? aliasById.get(r.actor_id) ?? null : null,
    target_user_id: r.target_user_id,
    target_alias: r.target_user_id ? aliasById.get(r.target_user_id) ?? null : null,
  }));
}
