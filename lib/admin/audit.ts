import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuditAction =
  | "user.update"
  | "user.ban"
  | "user.unban"
  | "user.force_sign_out"
  | "user.password_reset"
  | "user.promote_admin"
  | "user.demote_admin"
  | "user.delete"
  | "user.export";

export async function recordAudit(params: {
  actorId: string;
  action: AuditAction;
  targetUserId: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}): Promise<void> {
  const admin = createAdminClient();
  await admin.from("audit_log").insert({
    actor_id: params.actorId,
    action: params.action,
    target_user_id: params.targetUserId,
    before: params.before ?? null,
    after: params.after ?? null,
  });
}
