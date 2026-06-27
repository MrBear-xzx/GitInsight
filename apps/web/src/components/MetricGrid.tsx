"use client";

import type { MetricItem } from "@/lib/api";
import MetricCard from "./MetricCard";

export default function MetricGrid({ metrics }: { metrics: MetricItem[] }) {
  return (
    <div style={gridStyle}>
      {metrics.map((m) => (
        <MetricCard key={m.metric_key} metric={m} />
      ))}
    </div>
  );
}

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: 16,
  padding: 16,
};
