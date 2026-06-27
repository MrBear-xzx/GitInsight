import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "GitInsight",
  description: "Git 仓库分析与团队效能看板",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{keyframesStyle}</style>
      </head>
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <nav style={navStyle}>
          <Link href="/" style={navBrandStyle}>GitInsight</Link>
          <div style={navLinksStyle}>
            <Link href="/" style={navLinkStyle}>首页</Link>
            <Link href="/history" style={navLinkStyle}>记录</Link>
          </div>
        </nav>
        <div style={{ animation: "fadeIn 0.3s ease-out" }}>{children}</div>
      </body>
    </html>
  );
}

const keyframesStyle = `
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
@keyframes fadeIn {
  0% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

const navStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 16px",
  backgroundColor: "#1a1a2e",
  color: "#fff",
};

const navBrandStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: "#fff",
  textDecoration: "none",
  transition: "opacity 0.2s",
};

const navLinksStyle: React.CSSProperties = {
  display: "flex",
  gap: 16,
};

const navLinkStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#ccc",
  textDecoration: "none",
  transition: "color 0.2s",
};

