"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CROMIO_COLORS } from "@/lib/design/colors";
import { ChartCard } from "./ChartCard";

const P = CROMIO_COLORS.admin.chart;

export function DonutChart({
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
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={P[i % P.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
