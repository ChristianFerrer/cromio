"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CROMIO_COLORS } from "@/lib/design/colors";
import { ChartCard } from "./ChartCard";
import type { DailyPoint } from "@/lib/admin/metrics";

const P = CROMIO_COLORS.admin.chart;

export function TimeSeriesChart({
  title,
  data,
}: {
  title: string;
  data: DailyPoint[];
}) {
  return (
    <ChartCard title={title} empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <RLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={CROMIO_COLORS.line} />
          <XAxis dataKey="day" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="page_view" stroke={P[0]} strokeWidth={2} dot={false} name="Views" />
          <Line type="monotone" dataKey="session_start" stroke={P[5]} strokeWidth={2} dot={false} name="Sesiones" />
          <Line type="monotone" dataKey="signup_done" stroke={P[3]} strokeWidth={2} dot={false} name="Signups" />
          <Line type="monotone" dataKey="message_sent" stroke={P[4]} strokeWidth={2} dot={false} name="Mensajes" />
          <Line type="monotone" dataKey="meeting_completed" stroke={P[6]} strokeWidth={2} dot={false} name="Trades" />
        </RLineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
