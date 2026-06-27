"use client";

import { useState } from "react";

type TaskFormProps = {
  onSubmit: (input: {
    repo_url: string;
    pat?: string;
    time_window: string;
  }) => void;
  loading: boolean;
};

export default function TaskForm({ onSubmit, loading }: TaskFormProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [pat, setPat] = useState("");
  const [timeWindow, setTimeWindow] = useState("90d");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    onSubmit({
      repo_url: repoUrl.trim(),
      pat: pat.trim() || undefined,
      time_window: timeWindow,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <div style={fieldStyle}>
        <label htmlFor="repoUrl" style={labelStyle}>
          Git 仓库 URL
        </label>
        <input
          id="repoUrl"
          type="text"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/org/repo"
          required
          style={inputStyle}
        />
      </div>

      <div style={fieldStyle}>
        <label htmlFor="pat" style={labelStyle}>
          PAT（私有仓库可选）
        </label>
        <input
          id="pat"
          type="password"
          value={pat}
          onChange={(e) => setPat(e.target.value)}
          placeholder="ghp_xxx"
          style={inputStyle}
        />
      </div>

      <div style={fieldStyle}>
        <label htmlFor="timeWindow" style={labelStyle}>
          时间窗口
        </label>
        <select
          id="timeWindow"
          value={timeWindow}
          onChange={(e) => setTimeWindow(e.target.value)}
          style={inputStyle}
        >
          <option value="30d">30 天</option>
          <option value="90d">90 天（默认）</option>
          <option value="180d">180 天</option>
        </select>
      </div>

      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? "分析中..." : "开始分析"}
      </button>
    </form>
  );
}

const formStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  maxWidth: 480,
  margin: "0 auto",
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#333",
};

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 15,
  border: "1px solid #d0d0d0",
  borderRadius: 8,
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  padding: "12px 24px",
  fontSize: 16,
  fontWeight: 600,
  color: "#fff",
  backgroundColor: "#1a73e8",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  marginTop: 8,
  transition: "background-color 0.2s, transform 0.1s",
};
