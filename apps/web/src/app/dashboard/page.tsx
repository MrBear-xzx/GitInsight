"use client";

import { Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import MetricGrid from "@/components/MetricGrid";
import MetricChart from "@/components/MetricChart";
import { LoadingSkeleton, EmptyState, ErrorState } from "@/components/States";
import { getDashboard, type DashboardData } from "@/lib/api";

function DashboardContent() {
  const searchParams = useSearchParams();
  const repoId = searchParams.get("repo_id") ?? "";
  const window = searchParams.get("window") ?? "90d";

  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const d = await getDashboard(repoId, window);
      setData(d);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取看板失败");
      setLoading(false);
    }
  }, [repoId, window]);

  useEffect(() => {
    if (!repoId) {
      setError("缺少 repo_id 参数");
      setLoading(false);
      return;
    }
    fetchData();
  }, [fetchData, repoId]);

  if (!repoId) {
    return (
      <EmptyState
        icon={"🔍"}
        title="缺少仓库参数"
        description="请从首页提交分析任务后访问看板，或直接提供 repo_id 参数。"
        action={{ label: "新建分析", href: "/" }}
      />
    );
  }

  if (loading) {
    return (
      <div>
        <div style={{ padding: "24px 24px 0", textAlign: "center" }}>
          <div style={{ height: 32, width: 200, background: "#f0f0f0", borderRadius: 8, margin: "0 auto 8px", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ height: 16, width: 300, background: "#f0f0f0", borderRadius: 6, margin: "0 auto", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "0.2s" }} />
        </div>
        <LoadingSkeleton type="chart" count={4} />
        <LoadingSkeleton type="card" count={6} />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  return (
    <>
      <div style={headerStyle}>
        <h1 style={titleStyle}>项目健康看板</h1>
        <p style={subtitleStyle}>
          仓库: {repoId} &nbsp;|&nbsp; 窗口: {window}
        </p>
      </div>

      {data && (
        <div style={chartsRowStyle}>
          {data.metrics
            .filter((m) =>
              ["health_score", "delivery_throughput", "bus_factor_risk", "rework_ratio"].includes(m.metric_key)
            )
            .map((m) => (
              <MetricChart key={m.metric_key} metric={m} />
            ))}
        </div>
      )}

      {data && <MetricGrid metrics={data.metrics} />}
    </>
  );
}

export default function DashboardPage() {
  return (
    <main style={mainStyle}>
      <Suspense fallback={<LoadingSkeleton type="chart" count={4} />}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}

const mainStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f0f2f5",
  paddingBottom: 48,
  paddingLeft: 16,
  paddingRight: 16,
};

const centerStyle: React.CSSProperties = {
  textAlign: "center",
  padding: 48,
  fontSize: 16,
  color: "#666",
};

const headerStyle: React.CSSProperties = {
  padding: "24px 24px 0",
  textAlign: "center",
};

const titleStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: "#1a1a2e",
  margin: 0,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#666",
  marginTop: 4,
};

const chartsRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: 12,
  padding: "16px 16px 0",
  maxWidth: 960,
  margin: "0 auto",
};
