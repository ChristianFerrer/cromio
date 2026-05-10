"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardPayload } from "@/lib/admin/metrics";

const PALETTE = ["#1FAE5A", "#0E8A48", "#22C55E", "#16A34A", "#06B6D4", "#2D7DD8", "#D7263D"];

function Card({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-line bg-white p-4">
      <h3 className="mb-2 font-display text-sm text-text">{title}</h3>
      <div className="h-64">
        {empty ? (
          <div className="grid h-full place-items-center text-xs text-text-2">
            sin datos
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

const STEP_LABEL: Record<string, string> = {
  signup_done: "Signup",
  onboarding_done: "Onboarding",
  first_cromo_added: "Primer cromo",
  chat_opened: "Primer chat",
  meeting_confirmed: "Quedada",
  meeting_completed: "Intercambio",
};

export function DashboardCharts({ data, labels }: { data: DashboardPayload; labels: Record<string, string> }) {
  const dailyEmpty = data.daily.length === 0;
  const countriesEmpty = data.countries.length === 0;
  const devicesEmpty = data.devices.length === 0;
  const funnelEmpty = data.funnel.every((f) => f.users === 0);
  const wantedEmpty = data.topWanted.length === 0;
  const spareEmpty = data.topSpare.length === 0;
  const radiiEmpty = data.radii.length === 0;
  const ratingsEmpty = data.ratings.length === 0;

  const deviceData = data.devices.map((d) => ({
    name: `${d.device}${d.is_pwa ? " · PWA" : ""}`,
    count: d.count,
  }));

  const funnelData = data.funnel.map((f) => ({
    name: STEP_LABEL[f.step] ?? f.step,
    value: f.users,
  }));

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Card title={labels.timeSeries} empty={dailyEmpty}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="page_view" stroke={PALETTE[0]} strokeWidth={2} dot={false} name="Views" />
            <Line type="monotone" dataKey="session_start" stroke={PALETTE[5]} strokeWidth={2} dot={false} name="Sesiones" />
            <Line type="monotone" dataKey="signup_done" stroke={PALETTE[3]} strokeWidth={2} dot={false} name="Signups" />
            <Line type="monotone" dataKey="message_sent" stroke={PALETTE[4]} strokeWidth={2} dot={false} name="Mensajes" />
            <Line type="monotone" dataKey="meeting_completed" stroke={PALETTE[6]} strokeWidth={2} dot={false} name="Trades" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card title={labels.countries} empty={countriesEmpty}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.countries} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
            <YAxis dataKey="country" type="category" tick={{ fontSize: 10 }} width={50} />
            <Tooltip />
            <Bar dataKey="count" fill={PALETTE[0]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title={labels.funnel} empty={funnelEmpty}>
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart>
            <Tooltip />
            <Funnel data={funnelData} dataKey="value" isAnimationActive={false}>
              {funnelData.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
              <LabelList position="right" fill="#111" stroke="none" dataKey="name" />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </Card>

      <Card title={labels.devices} empty={devicesEmpty}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={deviceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill={PALETTE[1]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title={labels.topWanted} empty={wantedEmpty}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.topWanted}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="sticker_n" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="users_missing" fill={PALETTE[6]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title={labels.topSpare} empty={spareEmpty}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.topSpare}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="sticker_n" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="spare_total" fill={PALETTE[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title={labels.radii} empty={radiiEmpty}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.radii}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill={PALETTE[2]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title={labels.ratings} empty={ratingsEmpty}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.ratings}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="stars" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill={PALETTE[4]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
