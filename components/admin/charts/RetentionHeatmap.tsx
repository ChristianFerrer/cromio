"use client";

import { CROMIO_COLORS } from "@/lib/design/colors";
import { ChartCard } from "./ChartCard";

export type RetentionCell = {
  cohort: string;
  day_offset: number;
  cohort_size: number;
  retained: number;
};

type Pivot = {
  cohort: string;
  cohort_size: number;
  buckets: Map<number, number>;
};

const OFFSETS = [0, 1, 7, 14, 30];

function blend(rate: number): string {
  if (rate <= 0) return CROMIO_COLORS.paper;
  const stops = [
    { stop: 0.05, color: CROMIO_COLORS.green[100] },
    { stop: 0.2, color: CROMIO_COLORS.green[500] },
    { stop: 0.5, color: CROMIO_COLORS.green[700] },
    { stop: 1, color: CROMIO_COLORS.green[900] },
  ];
  for (const s of stops) {
    if (rate <= s.stop) return s.color;
  }
  return CROMIO_COLORS.green[900];
}

function pivot(rows: RetentionCell[]): Pivot[] {
  const map = new Map<string, Pivot>();
  for (const r of rows) {
    if (!map.has(r.cohort)) {
      map.set(r.cohort, {
        cohort: r.cohort,
        cohort_size: r.cohort_size,
        buckets: new Map(),
      });
    }
    const p = map.get(r.cohort)!;
    p.cohort_size = r.cohort_size;
    p.buckets.set(r.day_offset, r.retained);
  }
  return Array.from(map.values()).sort((a, b) => b.cohort.localeCompare(a.cohort));
}

export function RetentionHeatmap({
  title,
  rows,
}: {
  title: string;
  rows: RetentionCell[];
}) {
  const cohorts = pivot(rows);
  const empty = cohorts.length === 0;

  return (
    <ChartCard title={title} empty={empty}>
      <div className="h-full overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white px-2 py-1 text-left text-text-2">
                Cohort
              </th>
              <th className="px-2 py-1 text-right text-text-2">N</th>
              {OFFSETS.map((d) => (
                <th key={d} className="px-2 py-1 text-right text-text-2">
                  D{d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.map((c) => (
              <tr key={c.cohort}>
                <td className="sticky left-0 z-10 bg-white px-2 py-1 font-mono text-[11px]">
                  {c.cohort}
                </td>
                <td className="px-2 py-1 text-right text-text-2">
                  {c.cohort_size}
                </td>
                {OFFSETS.map((d) => {
                  const retained = c.buckets.get(d) ?? 0;
                  const rate = c.cohort_size > 0 ? retained / c.cohort_size : 0;
                  const bg = blend(rate);
                  const fg = rate > 0.2 ? "#FFFFFF" : CROMIO_COLORS.text;
                  return (
                    <td
                      key={d}
                      className="px-2 py-1 text-right font-mono"
                      style={{ background: bg, color: fg }}
                      title={`${retained}/${c.cohort_size}`}
                    >
                      {rate > 0 ? `${Math.round(rate * 100)}%` : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
