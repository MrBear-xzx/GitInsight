# M4: 前端看板初始化

**日期**: 2026-06-25
**状态**: ✅ 已完成

## 目标

创建 Next.js 前端应用，实现任务创建和指标看板展示。

## 改动清单

### 新增
- `apps/web/` — Next.js 前端项目
  - `package.json` — 依赖声明
  - `tsconfig.json` — TypeScript 配置
  - `next.config.js` — Next.js 配置（standalone output）
  - `next-env.d.ts` — Next.js 类型声明
  - `src/app/layout.tsx` — 根布局
  - `src/app/page.tsx` — 首页（任务创建表单）
  - `src/app/dashboard/page.tsx` — 看板页（指标展示）
  - `src/components/TaskForm.tsx` — 任务创建表单组件
  - `src/components/MetricCard.tsx` — 单指标卡片（含风险颜色）
  - `src/components/MetricGrid.tsx` — 指标网格布局
  - `src/lib/api.ts` — API 客户端

### 路由

| 路由 | 说明 |
|------|------|
| `/` | 首页：输入仓库 URL / 选择时间窗口 / 提交分析 |
| `/dashboard?repo_id=xxx&window=90d` | 看板：展示 9 项指标卡片 |

### 数据流
1. 用户填写表单 → `POST /api/v1/analysis-jobs`
2. 轮询 `GET /api/v1/analysis-jobs/{job_id}` 直到 SUCCEEDED
3. 跳转 `/dashboard` → `GET /api/v1/dashboard`
4. 渲染 MetricCard × 9（绿色/黄色/红色风险标识）

## 验证

- 项目结构完整，Next.js 配置正确
- 需安装依赖后运行 `pnpm --filter @gitinsight/web build` 验证
