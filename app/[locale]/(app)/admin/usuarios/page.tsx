import { getTranslations } from "next-intl/server";
import { listUsers, type UserListParams } from "@/lib/admin/users";
import { UserFilters } from "@/components/admin/UserFilters";
import { Pagination } from "@/components/admin/Pagination";
import { UsersTable } from "@/components/admin/UsersTable";
import { UsersList } from "@/components/admin/UsersList";

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

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = parseParams(sp);
  const t = await getTranslations("admin.users");
  const result = await listUsers(params);

  const labels = {
    user: t("columns.user"),
    email: t("columns.email"),
    plan: t("columns.plan"),
    rating: t("columns.rating"),
    trades: t("columns.trades"),
    lastSeen: t("columns.lastSeen"),
    createdAt: t("columns.createdAt"),
    status: t("columns.status"),
  };

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
          <div className="mt-4">
            <UsersTable rows={result.rows} labels={labels} />
            <UsersList rows={result.rows} />
          </div>
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
