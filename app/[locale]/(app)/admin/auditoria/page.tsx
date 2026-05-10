import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listRecentAudit } from "@/lib/admin/audit-query";

export const dynamic = "force-dynamic";

function fmt(iso: string): string {
  return iso.slice(0, 19).replace("T", " ");
}

export default async function AdminAuditPage() {
  const t = await getTranslations("admin.audit");
  const rows = await listRecentAudit(100);

  if (rows.length === 0) {
    return (
      <section className="rounded-md border border-line bg-white p-6 text-center text-sm text-text-2">
        {t("empty")}
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-3 font-display text-xl">{t("title")}</h2>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-md border border-line bg-white md:block">
        <table className="w-full text-sm">
          <thead className="bg-paper text-left text-xs uppercase tracking-wide text-text-2">
            <tr>
              <th className="px-3 py-2">{t("columns.when")}</th>
              <th className="px-3 py-2">{t("columns.actor")}</th>
              <th className="px-3 py-2">{t("columns.action")}</th>
              <th className="px-3 py-2">{t("columns.target")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-paper">
                <td className="px-3 py-2 text-text-2">{fmt(row.created_at)}</td>
                <td className="px-3 py-2">
                  {row.actor_alias ? `@${row.actor_alias}` : row.actor_id ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <code className="rounded bg-line/40 px-1.5 py-0.5 font-mono text-xs">
                    {row.action}
                  </code>
                </td>
                <td className="px-3 py-2">
                  {row.target_user_id ? (
                    <Link
                      href={`/admin/usuarios/${row.target_user_id}`}
                      className="text-green-700 hover:underline"
                    >
                      @{row.target_alias ?? row.target_user_id}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-2 md:hidden">
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-md border border-line bg-white p-3 text-sm"
          >
            <p className="text-xs text-text-2">{fmt(row.created_at)}</p>
            <p className="mt-1">
              <span className="font-bold">
                {row.actor_alias ? `@${row.actor_alias}` : "—"}
              </span>{" "}
              <code className="rounded bg-line/40 px-1 py-0.5 font-mono text-xs">
                {row.action}
              </code>
            </p>
            {row.target_user_id && (
              <Link
                href={`/admin/usuarios/${row.target_user_id}`}
                className="mt-1 inline-block text-xs text-green-700"
              >
                → @{row.target_alias ?? row.target_user_id}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
