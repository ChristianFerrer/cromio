import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getUserDetail } from "@/lib/admin/users";
import { requireAdmin } from "@/lib/admin/guard";
import { Avatar } from "@/components/admin/Avatar";
import { UserEditForm } from "@/components/admin/UserEditForm";
import { UserActions } from "@/components/admin/UserActions";

export const dynamic = "force-dynamic";

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toISOString().slice(0, 16).replace("T", " ");
}

export default async function AdminUserDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAdmin();
  const { id } = await params;
  const user = await getUserDetail(id);
  if (!user) notFound();
  const t = await getTranslations("admin.users");

  const isSelf = ctx.userId === user.id;

  return (
    <section>
      <Link
        href="/admin/usuarios"
        className="inline-flex items-center gap-1 text-sm text-text-2 hover:text-text"
      >
        <ArrowLeft size={14} /> {t("detail.back")}
      </Link>

      <header className="mt-3 flex items-center gap-3">
        <Avatar
          alias={user.alias}
          color={user.color}
          avatarUrl={user.avatar_url}
          size={56}
        />
        <div className="min-w-0">
          <h2 className="truncate font-display text-2xl">
            {user.display_name || user.alias}
          </h2>
          <p className="truncate text-sm text-text-2">
            @{user.alias} · {user.email ?? "—"}
          </p>
          <p className="mt-0.5 text-xs text-text-2">
            ★ {user.rating ?? "—"} · {user.trades_count ?? 0} cambios ·{" "}
            {user.is_admin && (
              <span className="font-bold text-green-700">admin</span>
            )}
            {user.banned_at && (
              <span className="ml-1 font-bold text-red-600">banned</span>
            )}
          </p>
        </div>
      </header>

      <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={t("detail.summary")} value={user.plan ?? "free"} />
        <Stat label="Cromos" value={`${user.unique_stickers}`} />
        <Stat label="Mensajes" value={`${user.messages_sent}`} />
        <Stat label="Chats" value={`${user.chats_count}`} />
        <Stat label="Reports abiertos" value={`${user.open_reports}`} />
        <Stat label="Última actividad" value={fmt(user.last_event_at)} />
        <Stat label="Registrado" value={fmt(user.created_at)} />
        <Stat
          label="Localización"
          value={user.has_location ? "sí" : "no"}
        />
      </section>

      {user.banned_at && (
        <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm">
          <p className="font-bold text-red-700">
            Banned at {fmt(user.banned_at)}
          </p>
          {user.ban_reason && (
            <p className="mt-1 text-red-700">{user.ban_reason}</p>
          )}
        </div>
      )}

      <h3 className="mt-6 font-display text-base">Perfil</h3>
      <UserEditForm
        userId={user.id}
        alias={user.alias}
        displayName={user.display_name}
        color={user.color}
        plan={user.plan}
        bio={user.bio}
      />

      <UserActions
        userId={user.id}
        isBanned={Boolean(user.banned_at)}
        isAdmin={user.is_admin}
        alias={user.alias}
        isSelf={isSelf}
      />
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-text-2">
        {label}
      </p>
      <p className="mt-0.5 font-display text-base text-text">{value}</p>
    </div>
  );
}
