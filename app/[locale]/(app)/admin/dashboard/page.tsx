import { getTranslations } from "next-intl/server";
import { loadDashboard, type Range } from "@/lib/admin/metrics";
import { RangeSelector } from "@/components/admin/RangeSelector";
import { DashboardCharts } from "@/components/admin/DashboardCharts";

export const dynamic = "force-dynamic";

const VALID_RANGES: Range[] = ["24h", "7d", "30d", "90d", "all"];

function fmtNumber(n: number): string {
  return new Intl.NumberFormat("es-ES").format(n);
}
function fmtRating(n: number | null): string {
  return n == null ? "—" : n.toFixed(2);
}
function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.range) ? sp.range[0] : sp.range;
  const range: Range = VALID_RANGES.includes(raw as Range) ? (raw as Range) : "7d";
  const t = await getTranslations("admin");
  const data = await loadDashboard(range);

  const k = data.kpis;

  return (
    <section>
      <RangeSelector active={range} />

      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <Kpi label={t("kpi.totalUsers")} value={fmtNumber(k.totalUsers)} />
        <Kpi label={t("kpi.dau")} value={fmtNumber(k.dau)} sub={`WAU ${fmtNumber(k.wau)} · MAU ${fmtNumber(k.mau)}`} />
        <Kpi label={t("kpi.completedTrades")} value={fmtNumber(k.completedTrades)} />
        <Kpi label={t("kpi.avgRating")} value={fmtRating(k.avgRating)} />
        <Kpi label={t("kpi.pushOptIn")} value={fmtPct(k.pushOptInPct)} />
        <Kpi label={t("kpi.openReports")} value={fmtNumber(k.openReports)} />
        <Kpi label="WAU" value={fmtNumber(k.wau)} />
        <Kpi label="MAU" value={fmtNumber(k.mau)} />
      </div>

      <div className="mt-4">
        <DashboardCharts
          data={data}
          labels={{
            timeSeries: `${t("charts.pageViews")} · ${t("charts.signups")} · ${t("charts.messages")} · ${t("charts.trades")}`,
            countries: t("charts.countries"),
            funnel: t("charts.funnel"),
            devices: t("charts.devices"),
            topWanted: t("charts.topWanted"),
            topSpare: t("charts.topSpare"),
            radii: t("charts.radii"),
            ratings: t("charts.ratings"),
          }}
        />
      </div>
    </section>
  );
}

function Kpi({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-md border border-line bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-text-2">
        {label}
      </p>
      <p className="mt-0.5 font-display text-2xl text-text">{value}</p>
      {sub && <p className="mt-0.5 truncate text-[10px] text-text-2">{sub}</p>}
    </div>
  );
}
