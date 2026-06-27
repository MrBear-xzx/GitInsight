"use client";

import type { MetricItem } from "@/lib/api";
import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
  loading: () => <div style={placeholderStyle}>加载图表...</div>,
});

const RISK_COLORS: Record<string, string> = {
  green: "#34a853",
  yellow: "#fbbc04",
  red: "#ea4335",
};

const METRIC_CONFIGS: Record<
  string,
  { label: string; icon: string; chart: "gauge" | "bar" | "score" }
> = {
  delivery_throughput: { label: "交付吞吐", icon: "📊", chart: "gauge" },
  health_score: { label: "项目健康分", icon: "💚", chart: "score" },
  bus_factor_risk: { label: "Bus Factor", icon: "⚠️", chart: "gauge" },
  rework_ratio: { label: "返工率", icon: "🔄", chart: "gauge" },
  active_contributors: { label: "活跃贡献者", icon: "👥", chart: "bar" },
};

export default function MetricChart({ metric }: { metric: MetricItem }) {
  const config = METRIC_CONFIGS[metric.metric_key];
  if (!config) return null;

  const color = RISK_COLORS[metric.risk_level] ?? "#999";

  const getOption = () => {
    if (config.chart === "gauge") {
      return {
        series: [
          {
            type: "gauge",
            startAngle: 200,
            endAngle: -20,
            min: 0,
            max: metric.unit.includes("%") ? 100 : 100,
            pointer: { show: false },
            progress: {
              show: true,
              width: 12,
              itemStyle: { color },
            },
            axisLine: {
              lineStyle: { width: 12, color: [[1, "#e8e8e8"]] },
            },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            detail: {
              show: true,
              offsetCenter: [0, "60%"],
              fontSize: 20,
              fontWeight: "bold",
              color: "#333",
              formatter: () => `${metric.value}${metric.unit === "score" ? "" : metric.unit === "%" ? "%" : ""}`,
            },
            title: {
              offsetCenter: [0, "85%"],
              fontSize: 12,
              color: "#666",
            },
            data: [{ value: metric.value }],
          },
        ],
      };
    }

    if (config.chart === "score") {
      return {
        series: [
          {
            type: "gauge",
            startAngle: 200,
            endAngle: -20,
            min: 0,
            max: 100,
            pointer: { show: false },
            progress: {
              show: true,
              width: 16,
              itemStyle: { color },
            },
            axisLine: {
              lineStyle: { width: 16, color: [[1, "#e8e8e8"]] },
            },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            detail: {
              show: true,
              offsetCenter: [0, "55%"],
              fontSize: 28,
              fontWeight: "bold",
              color,
            },
            title: {
              offsetCenter: [0, "85%"],
              fontSize: 12,
              color: "#666",
            },
            data: [{ value: metric.value }],
          },
        ],
      };
    }

    if (config.chart === "bar") {
      return {
        grid: { top: 10, bottom: 10, left: 10, right: 10 },
        xAxis: {
          type: "category",
          data: [config.label],
          axisLabel: { show: false },
          axisTick: { show: false },
          axisLine: { show: false },
        },
        yAxis: {
          type: "value",
          min: 0,
          splitLine: { show: false },
          axisLabel: { show: false },
        },
        series: [
          {
            type: "bar",
            data: [metric.value],
            itemStyle: { color, borderRadius: [6, 6, 0, 0] },
            barWidth: "40%",
            label: {
              show: true,
              position: "top",
              fontSize: 20,
              fontWeight: "bold",
              color: "#333",
              formatter: () => `${metric.value}`,
            },
          },
        ],
      };
    }

    return {};
  };

  return (
    <div style={chartCardStyle}>
      <div style={chartHeaderStyle}>
        <span style={{ fontWeight: 600 }}>{config.icon} {config.label}</span>
        <span style={{ fontSize: 11, color: "#aaa" }}>{metric.metric_key}</span>
      </div>
      <ReactECharts
        option={getOption()}
        style={{ height: 180 }}
        opts={{ renderer: "svg" }}
      />
    </div>
  );
}

const chartCardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  padding: 12,
  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
  transition: "transform 0.2s, box-shadow 0.2s",
  cursor: "default",
};

const chartHeaderStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 2,
  fontSize: 13,
  fontWeight: 600,
  color: "#444",
  marginBottom: 4,
};

const placeholderStyle: React.CSSProperties = {
  height: 180,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#999",
  fontSize: 13,
};
