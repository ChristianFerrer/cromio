import Link from "next/link";
import type { UserRow } from "@/lib/admin/users";
import { Avatar } from "@/components/admin/Avatar";
import { UserStatusBadges } from "@/components/admin/UserStatusBadges";

export function UsersList({ rows }: { rows: UserRow[] }) {
  return (
    <ul className="space-y-2 md:hidden">
      {rows.map((row) => (
        <li key={row.id}>
          <Link
            href={`/admin/usuarios/${row.id}`}
            className="flex items-center gap-3 rounded-md border border-line bg-white p-3"
          >
            <Avatar alias={row.alias} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-text">
                {row.display_name || row.alias}
              </p>
              <p className="truncate text-xs text-text-2">
                @{row.alias} · {row.email ?? "—"}
              </p>
              <p className="mt-0.5 text-xs text-text-2">
                {row.trades_count ?? 0} cambios
              </p>
            </div>
            <UserStatusBadges
              isAdmin={row.is_admin}
              bannedAt={row.banned_at}
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
