"use client";

import {
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CROMIO_COLORS } from "@/lib/design/colors";
import { ChartCard } from "./ChartCard";

const P = CROMIO_COLORS.admin.chart;

export function BarChart({
  title,
  data,
  xKey,
  yKey,
  colorIndex = 0,
  layout = "horizontal",
}: {
  title: string;
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  colorIndex?: number;
  layout?: "horizontal" | "vertical";
}) {
  const color = P[colorIndex % P.length];
  const radius: [number, number, number, number] =
    layout === "vertical" ? [0, 4, 4, 0] : [4, 4, 0, 0];

  return (
    <ChartCard title={title} empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <RBarChart data={data} layout={layout}>
          <CartesianGrid strokeDasharray="3 3" stroke={CROMIO_COLORS.line} />
          {layout === "vertical" ? (
            <>
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis
                dataKey={xKey}
                type="category"
                tick={{ fontSize: 10 }}
                width={50}
              />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            </>
          )}
          <Tooltip />
          <Bar dataKey={yKey} fill={color} radius={radius} />
        </RBarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
