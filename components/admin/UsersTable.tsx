import Link from "next/link";
import type { UserRow } from "@/lib/admin/users";
import { Avatar } from "@/components/admin/Avatar";
import { UserStatusBadges } from "@/components/admin/UserStatusBadges";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function UsersTable({
  rows,
  labels,
}: {
  rows: UserRow[];
  labels: Record<string, string>;
}) {
  return (
    <div className="hidden overflow-hidden rounded-md border border-line bg-white md:block">
      <table className="w-full text-sm">
        <thead className="bg-paper text-left text-xs uppercase tracking-wide text-text-2">
          <tr>
            <th className="px-3 py-2">{labels.user}</th>
            <th className="px-3 py-2">{labels.email}</th>
            <th className="px-3 py-2">{labels.plan}</th>
            <th className="px-3 py-2">{labels.rating}</th>
            <th className="px-3 py-2">{labels.trades}</th>
            <th className="px-3 py-2">{labels.lastSeen}</th>
            <th className="px-3 py-2">{labels.createdAt}</th>
            <th className="px-3 py-2">{labels.status}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-paper">
              <td className="px-3 py-2">
                <Link
                  href={`/admin/usuarios/${row.id}`}
                  className="flex items-center gap-2"
                >
                  <Avatar
                    alias={row.alias}
                    color={row.color}
                    avatarUrl={row.avatar_url}
                    size={28}
                  />
                  <span>
                    <span className="block font-bold text-text">
                      {row.display_name || row.alias}
                    </span>
                    <span className="block text-xs text-text-2">
                      @{row.alias}
                    </span>
                  </span>
                </Link>
              </td>
              <td className="px-3 py-2 text-text-2">{row.email ?? "—"}</td>
              <td className="px-3 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    row.plan === "pro"
                      ? "bg-gold/20 text-ink"
                      : "bg-line text-text-2"
                  }`}
                >
                  {row.plan ?? "free"}
                </span>
              </td>
              <td className="px-3 py-2">{row.rating ?? "—"}</td>
              <td className="px-3 py-2">{row.trades_count ?? 0}</td>
              <td className="px-3 py-2 text-text-2">
                {fmtDate(row.last_event_at)}
              </td>
              <td className="px-3 py-2 text-text-2">
                {fmtDate(row.created_at)}
              </td>
              <td className="px-3 py-2">
                <UserStatusBadges
                  isAdmin={row.is_admin}
                  bannedAt={row.banned_at}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
