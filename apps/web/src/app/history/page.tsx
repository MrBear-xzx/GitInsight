"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { listAnalysisJobs, type AnalysisJob } from "@/lib/api";
import { LoadingSkeleton, EmptyState, ErrorState } from "@/components/States";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "等待中",
  RUNNING_QUICK: "快速分析",
  QUICK_DONE: "快读完成",
  RUNNING_DEEP: "深度分析",
  SUCCEEDED: "已完成",
  FAILED_RETRYABLE: "重试中",
  FAILED_FINAL: "失败",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#999",
  RUNNING_QUICK: "#1a73e8",
  QUICK_DONE: "#34a853",
  RUNNING_DEEP: "#fbbc04",
  SUCCEEDED: "#34a853",
  FAILED_RETRYABLE: "#fbbc04",
  FAILED_FINAL: "#ea4335",
};

export default function HistoryPage() {
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listAnalysisJobs();
      setJobs(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取失败");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  if (loading) {
    return (
      <main style={mainStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>分析记录</h1>
        </div>
        <LoadingSkeleton type="table" count={5} />
      </main>
    );
  }

  if (error) {
    return (
      <main style={mainStyle}>
        <ErrorState message={error} onRetry={fetchJobs} />
      </main>
    );
  }

  return (
    <main style={mainStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>分析记录</h1>
        <Link href="/" style={linkStyle}>新建分析</Link>
      </div>
      <div style={tableWrapStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>仓库</th>
              <th style={thStyle}>状态</th>
              <th style={thStyle}>进度</th>
              <th style={thStyle}>时间窗口</th>
              <th style={thStyle}>创建时间</th>
              <th style={thStyle}>操作</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.job_id} style={trStyle}>
                <td style={tdStyle}>{job.repo_url || "-"}</td>
                <td style={tdStyle}>
                  <span style={{
                    ...statusBadgeStyle,
                    backgroundColor: STATUS_COLORS[job.status] ?? "#999",
                  }}>
                    {STATUS_LABELS[job.status] ?? job.status}
                  </span>
                </td>
                <td style={tdStyle}>{job.progress}%</td>
                <td style={tdStyle}>{job.time_window || "-"}</td>
                <td style={tdStyle}>{new Date(job.accepted_at).toLocaleString("zh-CN")}</td>
                <td style={tdStyle}>
                  {job.status === "SUCCEEDED" && (
                    <Link
                      href={"/dashboard?repo_id=" + encodeURIComponent(job.repo_url) + "&window=" + (job.time_window || "90d")}
                      style={actionLinkStyle}
                    >
                      看板
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {jobs.length === 0 && (
          <EmptyState
            icon={"📋"}
            title="暂无分析记录"
            description="提交第一个分析任务后，记录将显示在这里。"
            action={{ label: "新建分析", href: "/" }}
          />
        )}
      </div>
    </main>
  );
}

const mainStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f0f2f5",
  padding: "24px 16px",
};

const centerStyle: React.CSSProperties = {
  textAlign: "center",
  padding: 48,
  fontSize: 16,
  color: "#666",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
  maxWidth: 960,
  margin: "0 auto 20px",
  flexWrap: "wrap" as const,
  gap: 12,
};

const titleStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  color: "#1a1a2e",
  margin: 0,
};

const linkStyle: React.CSSProperties = {
  color: "#1a73e8",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 600,
};

const tableWrapStyle: React.CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
  background: "#fff",
  borderRadius: 12,
  overflow: "auto",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 16px",
  fontSize: 13,
  fontWeight: 600,
  color: "#666",
  borderBottom: "1px solid #e0e0e0",
  backgroundColor: "#fafafa",
};

const trStyle: React.CSSProperties = {
  borderBottom: "1px solid #f0f0f0",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 14,
  color: "#333",
};

const statusBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 600,
  color: "#fff",
};

const actionLinkStyle: React.CSSProperties = {
  color: "#1a73e8",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 600,
};
