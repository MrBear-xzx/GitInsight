"use client";

import React from "react";

// Shared styled components for loading / empty / error states

export function LoadingSkeleton({ type = "card", count = 1 }: { type?: "card" | "chart" | "table"; count?: number }) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === "table") {
    return (
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div
          style={{
            height: 40,
            background: "#f0f0f0",
            borderRadius: 8,
            marginBottom: 12,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        {items.map((i) => (
          <div
            key={i}
            style={{
              height: 52,
              background: "#fafafa",
              borderRadius: 8,
              marginBottom: 8,
              animation: "pulse 1.5s ease-in-out infinite",
              animationDelay: i * 0.1 + "s",
            }}
          />
        ))}
      </div>
    );
  }

  if (type === "chart") {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
          maxWidth: 960,
          margin: "0 auto",
          padding: "16px 16px 0",
        }}
      >
        {items.map((i) => (
          <div
            key={i}
            style={{
              height: 200,
              background: "#f0f0f0",
              borderRadius: 12,
              animation: "pulse 1.5s ease-in-out infinite",
              animationDelay: i * 0.15 + "s",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 16,
        padding: 16,
      }}
    >
      {items.map((i) => (
        <div
          key={i}
          style={{
            height: 120,
            background: "#f0f0f0",
            borderRadius: 12,
            animation: "pulse 1.5s ease-in-out infinite",
            animationDelay: i * 0.1 + "s",
          }}
        />
      ))}
    </div>
  );
}

export function EmptyState({
  icon = "💭",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div style={centerWrap}>
      <div style={{ fontSize: 48, marginBottom: 16, lineHeight: 1 }}>{icon}</div>
      <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600, color: "#333" }}>{title}</h3>
      {description && (
        <p style={{ margin: 0, fontSize: 14, color: "#888", maxWidth: 360, lineHeight: 1.6 }}>{description}</p>
      )}
      {action && (
        <a
          href={action.href}
          style={{
            display: "inline-block",
            marginTop: 20,
            padding: "10px 24px",
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            background: "#1a73e8",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            textDecoration: "none",
          }}
        >
          {action.label}
        </a>
      )}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div style={centerWrap}>
      <div style={{ fontSize: 48, marginBottom: 16, lineHeight: 1 }}>{"\u26A0\uFE0F"}</div>
      <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600, color: "#c5221f" }}>出错了</h3>
      <p style={{ margin: "0 0 8px", fontSize: 14, color: "#888", maxWidth: 400, lineHeight: 1.6 }}>{message}</p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 12 }}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              background: "#1a73e8",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            重试
          </button>
        )}
        <a
          href="/"
          style={{
            display: "inline-block",
            padding: "10px 24px",
            fontSize: 14,
            fontWeight: 600,
            color: "#555",
            background: "#e0e0e0",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            textDecoration: "none",
          }}
        >
          返回首页
        </a>
      </div>
    </div>
  );
}

const centerWrap: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "80px 24px",
  textAlign: "center",
};
