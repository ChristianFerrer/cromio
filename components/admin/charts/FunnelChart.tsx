"use client";

import {
  Cell,
  Funnel,
  FunnelChart as RFunnelChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CROMIO_COLORS } from "@/lib/design/colors";
import { ChartCard } from "./ChartCard";

const P = CROMIO_COLORS.admin.chart;

export function FunnelChart({
  title,
  data,
}: {
  title: string;
  data: { name: string; value: number }[];
}) {
  const empty = data.every((d) => d.value === 0);
  return (
    <ChartCard title={title} empty={empty}>
      <ResponsiveContainer width="100%" height="100%">
        <RFunnelChart>
          <Tooltip />
          <Funnel data={data} dataKey="value" isAnimationActive={false}>
            {data.map((_, i) => (
              <Cell key={i} fill={P[i % P.length]} />
            ))}
            <LabelList
              position="right"
              fill={CROMIO_COLORS.text}
              stroke="none"
              dataKey="name"
            />
          </Funnel>
        </RFunnelChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
