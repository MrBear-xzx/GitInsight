"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import TaskForm from "@/components/TaskForm";
import { createAnalysisJob, getAnalysisJob } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [progress, setProgress] = useState(0);

  const handleSubmit = useCallback(
    async (input: { repo_url: string; pat?: string; time_window: string }) => {
      setLoading(true);
      setProgress(0);
      setStatusMsg("正在创建分析任务...");
      try {
        const job = await createAnalysisJob({
          ...input,
          trigger_type: "manual",
        });
        setStatusMsg("分析任务已提交，等待结果...");
        setProgress(10);

        const poll = async () => {
          const current = await getAnalysisJob(job.job_id);
          setProgress(current.progress);
          const statusText = getStatusText(current.status);
          setStatusMsg(statusText);

          if (current.status === "SUCCEEDED") {
            setProgress(100);
            setStatusMsg("分析完成，跳转看板...");
            setTimeout(() => {
              router.push(
                "/dashboard?repo_id=" + encodeURIComponent(input.repo_url) + "&window=" + input.time_window
              );
            }, 500);
            return;
          }

          if (current.status === "FAILED_FINAL") {
            setStatusMsg("分析失败: " + (current.error_message ?? "未知错误"));
            setLoading(false);
            return;
          }

          setTimeout(poll, 2000);
        };

        poll();
      } catch (err) {
        setStatusMsg(err instanceof Error ? err.message : "创建任务失败");
        setLoading(false);
      }
    },
    [router]
  );

  return (
    <main style={mainStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>GitInsight</h1>
        <p style={subtitleStyle}>输入 Git 仓库地址，分析团队效能与项目健康度</p>
      </div>
      <TaskForm onSubmit={handleSubmit} loading={loading} />
      {statusMsg && (
        <div style={statusStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            {loading && <span style={spinnerStyle} />}
            <p style={{ margin: 0, fontSize: 14, color: statusMsg.includes("失败") ? "#c5221f" : "#555" }}>
              {statusMsg}
            </p>
          </div>
          {loading && (
            <div style={progressBarBg}>
              <div style={{ ...progressBarFill, width: progress + "%" }} />
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function getStatusText(status: string): string {
  switch (status) {
    case "RUNNING_QUICK": return "快速分析中...";
    case "QUICK_DONE": return "快速分析完成，进行深度分析...";
    case "RUNNING_DEEP": return "深度分析中...";
    default: return "状态: " + status;
  }
}

const mainStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px 16px",
  background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
};

const headerStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: 32,
};

const titleStyle: React.CSSProperties = {
  fontSize: 36,
  fontWeight: 800,
  color: "#1a1a2e",
  margin: 0,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 16,
  color: "#555",
  marginTop: 8,
};

const statusStyle: React.CSSProperties = {
  marginTop: 20,
  textAlign: "center",
  maxWidth: 400,
  width: "100%",
};

const progressBarBg: React.CSSProperties = {
  width: "100%",
  height: 6,
  backgroundColor: "#e0e0e0",
  borderRadius: 3,
  overflow: "hidden",
};

const progressBarFill: React.CSSProperties = {
  height: "100%",
  backgroundColor: "#1a73e8",
  borderRadius: 3,
  transition: "width 0.5s ease",
};

const spinnerStyle: React.CSSProperties = {
  display: "inline-block",
  width: 14,
  height: 14,
  border: "2px solid #e0e0e0",
  borderTop: "2px solid #1a73e8",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
  flexShrink: 0,
};
