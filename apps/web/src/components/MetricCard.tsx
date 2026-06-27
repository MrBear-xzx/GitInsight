"use client";

import type { MetricItem } from "@/lib/api";

const RISK_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  green: { bg: "#e6f4ea", border: "#34a853", text: "#1e7e34" },
  yellow: { bg: "#fef7e0", border: "#fbbc04", text: "#a88700" },
  red: { bg: "#fce8e6", border: "#ea4335", text: "#c5221f" },
};

export default function MetricCard({ metric }: { metric: MetricItem }) {
  const colors = RISK_COLORS[metric.risk_level] ?? RISK_COLORS.yellow;

  return (
    <div
      style={{
        ...cardStyle,
        borderLeft: `4px solid ${colors.border}`,
        backgroundColor: colors.bg,
      }}
    >
      <div style={nameStyle}>{metric.display_name}</div>
      <div style={valueStyle}>
        {typeof metric.value === "number"
          ? metric.value.toLocaleString()
          : metric.value}
        <span style={unitStyle}>{metric.unit}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            ...badgeStyle,
            backgroundColor: colors.border,
          }}
        >
          {metric.risk_level === "green"
            ? "健康"
            : metric.risk_level === "yellow"
              ? "关注"
              : "风险"}
        </span>
        <span style={{ fontSize: 12, color: "#666" }}>
          {metric.metric_key}
        </span>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 12,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  transition: "transform 0.2s, box-shadow 0.2s",
  cursor: "default",
};

const nameStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#555",
};

const valueStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: "#222",
  display: "flex",
  alignItems: "baseline",
  gap: 6,
};

const unitStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 400,
  color: "#777",
};

const badgeStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#fff",
  padding: "2px 8px",
  borderRadius: 10,
};
