import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listUsers, type UserListParams } from "@/lib/admin/users";
import { UserFilters } from "@/components/admin/UserFilters";
import { Pagination } from "@/components/admin/Pagination";
import { Avatar } from "@/components/admin/Avatar";

export const dynamic = "force-dynamic";

function parseParams(sp: Record<string, string | string[] | undefined>): UserListParams {
  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    search: get("search") ?? undefined,
    plan: (get("plan") as UserListParams["plan"]) ?? "any",
    status: (get("status") as UserListParams["status"]) ?? "any",
    location: (get("location") as UserListParams["location"]) ?? "any",
    adminsOnly: get("adminsOnly") === "1",
    sort: (get("sort") as UserListParams["sort"]) ?? "createdAt",
    dir: (get("dir") as UserListParams["dir"]) ?? "desc",
    page: Number(get("page") ?? "1") || 1,
  };
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = parseParams(sp);
  const t = await getTranslations("admin.users");
  const result = await listUsers(params);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xl">{t("title")}</h2>
        <span className="text-xs text-text-2">{result.total} total</span>
      </div>

      <UserFilters initialSearch={params.search ?? ""} />

      {result.rows.length === 0 ? (
        <p className="mt-6 rounded-md border border-line bg-white p-6 text-center text-sm text-text-2">
          {t("empty")}
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="mt-4 hidden overflow-hidden rounded-md border border-line bg-white md:block">
            <table className="w-full text-sm">
              <thead className="bg-paper text-left text-xs uppercase tracking-wide text-text-2">
                <tr>
                  <th className="px-3 py-2">{t("columns.user")}</th>
                  <th className="px-3 py-2">{t("columns.email")}</th>
                  <th className="px-3 py-2">{t("columns.plan")}</th>
                  <th className="px-3 py-2">{t("columns.rating")}</th>
                  <th className="px-3 py-2">{t("columns.trades")}</th>
                  <th className="px-3 py-2">{t("columns.lastSeen")}</th>
                  <th className="px-3 py-2">{t("columns.createdAt")}</th>
                  <th className="px-3 py-2">{t("columns.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.rows.map((row) => (
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
                      <StatusBadges row={row} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <ul className="mt-4 space-y-2 md:hidden">
            {result.rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/admin/usuarios/${row.id}`}
                  className="flex items-center gap-3 rounded-md border border-line bg-white p-3"
                >
                  <Avatar
                    alias={row.alias}
                    color={row.color}
                    avatarUrl={row.avatar_url}
                    size={40}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-text">
                      {row.display_name || row.alias}
                    </p>
                    <p className="truncate text-xs text-text-2">
                      @{row.alias} · {row.email ?? "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-text-2">
                      ★ {row.rating ?? "—"} · {row.trades_count ?? 0} cambios
                    </p>
                  </div>
                  <StatusBadges row={row} />
                </Link>
              </li>
            ))}
          </ul>

          <Pagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
          />
        </>
      )}
    </section>
  );
}

function StatusBadges({
  row,
}: {
  row: { is_admin: boolean; banned_at: string | null; plan: string | null };
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {row.is_admin && (
        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase text-green-700">
          admin
        </span>
      )}
      {row.banned_at && (
        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
          banned
        </span>
      )}
    </span>
  );
}
