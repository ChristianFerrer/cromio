import { getTranslations } from "next-intl/server";
import { loadDashboard, type Range } from "@/lib/admin/metrics";
import { RangeSelector } from "@/components/admin/RangeSelector";
import { KpiCard } from "@/components/admin/KpiCard";
import { TimeSeriesChart } from "@/components/admin/charts/LineChart";
import { BarChart } from "@/components/admin/charts/BarChart";
import { DonutChart } from "@/components/admin/charts/DonutChart";
import { FunnelChart } from "@/components/admin/charts/FunnelChart";
import { RetentionHeatmap } from "@/components/admin/charts/RetentionHeatmap";

export const dynamic = "force-dynamic";

const VALID_RANGES: Range[] = ["24h", "7d", "30d", "90d", "all"];

const STEP_LABEL: Record<string, string> = {
  signup_done: "Signup",
  onboarding_done: "Onboarding",
  first_cromo_added: "Primer cromo",
  chat_opened: "Primer chat",
  meeting_confirmed: "Quedada",
  meeting_completed: "Intercambio",
};

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
  const devicesData = data.devices.map((d) => ({
    name: `${d.device}${d.is_pwa ? " · PWA" : ""}`,
    value: d.count,
  }));
  const funnelData = data.funnel.map((f) => ({
    name: STEP_LABEL[f.step] ?? f.step,
    value: f.users,
  }));

  return (
    <section>
      <RangeSelector active={range} />

      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <KpiCard label={t("kpi.totalUsers")} value={fmtNumber(k.totalUsers)} />
        <KpiCard
          label={t("kpi.dau")}
          value={fmtNumber(k.dau)}
          sub={`WAU ${fmtNumber(k.wau)} · MAU ${fmtNumber(k.mau)}`}
        />
        <KpiCard label={t("kpi.completedTrades")} value={fmtNumber(k.completedTrades)} />
        <KpiCard label={t("kpi.avgRating")} value={fmtRating(k.avgRating)} />
        <KpiCard label={t("kpi.pushOptIn")} value={fmtPct(k.pushOptInPct)} />
        <KpiCard label={t("kpi.openReports")} value={fmtNumber(k.openReports)} />
        <KpiCard label={t("kpi.wau")} value={fmtNumber(k.wau)} />
        <KpiCard label={t("kpi.mau")} value={fmtNumber(k.mau)} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <TimeSeriesChart
          title={`${t("charts.pageViews")} · ${t("charts.signups")} · ${t("charts.messages")} · ${t("charts.trades")}`}
          data={data.daily}
        />
        <BarChart
          title={t("charts.countries")}
          data={data.countries as unknown as Array<Record<string, unknown>>}
          xKey="country"
          yKey="count"
          layout="vertical"
          colorIndex={0}
        />
        <FunnelChart title={t("charts.funnel")} data={funnelData} />
        <DonutChart title={t("charts.devices")} data={devicesData} />
        <BarChart
          title={t("charts.topWanted")}
          data={data.topWanted as unknown as Array<Record<string, unknown>>}
          xKey="sticker_n"
          yKey="users_missing"
          colorIndex={6}
        />
        <BarChart
          title={t("charts.topSpare")}
          data={data.topSpare as unknown as Array<Record<string, unknown>>}
          xKey="sticker_n"
          yKey="spare_total"
          colorIndex={0}
        />
        <BarChart
          title={t("charts.radii")}
          data={data.radii as unknown as Array<Record<string, unknown>>}
          xKey="bucket"
          yKey="count"
          colorIndex={2}
        />
        <BarChart
          title={t("charts.ratings")}
          data={data.ratings as unknown as Array<Record<string, unknown>>}
          xKey="stars"
          yKey="count"
          colorIndex={4}
        />
        <div className="md:col-span-2">
          <RetentionHeatmap title={t("charts.retention")} rows={data.retention} />
        </div>
      </div>
    </section>
  );
}
