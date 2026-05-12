import type { UserDetail } from "@/lib/admin/users";
import { Avatar } from "@/components/admin/Avatar";

export function UserDetailHeader({ user }: { user: UserDetail }) {
  return (
    <header className="mt-3 flex items-center gap-3">
      <Avatar alias={user.alias} size={56} />
      <div className="min-w-0">
        <h2 className="truncate font-display text-2xl">
          {user.display_name || user.alias}
        </h2>
        <p className="truncate text-sm text-text-2">
          @{user.alias} · {user.email ?? "—"}
        </p>
        <p className="mt-0.5 text-xs text-text-2">
          ★ {user.rating ?? "—"} · {user.trades_count ?? 0} cambios
          {user.is_admin && (
            <span className="ml-1 font-bold text-green-700">· admin</span>
          )}
          {user.banned_at && (
            <span className="ml-1 font-bold text-red-600">· banned</span>
          )}
        </p>
      </div>
    </header>
  );
}
