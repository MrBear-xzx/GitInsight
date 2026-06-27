# GitInsight

GitInsight 是一个面向团队管理者的 Git 仓库分析 Web 应用。用户输入仓库地址后，系统将克隆并分析提交历史，生成可视化看板，帮助识别团队效能瓶颈、代码演进风险和项目健康状况。

## 当前状态

V1 核心链路已打通：仓库输入 → 克隆 → 日志解析 → 9 项指标计算 → 看板展示。

## 架构

```text
apps/
├── api/          # NestJS REST API（任务管理 + Dashboard）
├── worker/       # BullMQ Worker（克隆 + 解析 + 指标计算）
└── web/          # Next.js 前端（任务创建 + 看板）
```

## 快速开始

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动 API（端口 3000）
pnpm --filter @gitinsight/api dev

# 启动 Worker
pnpm --filter @gitinsight/worker dev

# 启动前端开发服务器（端口 3001）
pnpm --filter @gitinsight/web dev
```

### Docker 一键启动

```bash
docker compose up -d
# API: http://localhost:3000
# Web: http://localhost:3001
```

## 数据流

```text
用户 → 输入仓库 URL
  → POST /api/v1/analysis-jobs → 任务创建
    → Worker 消费队列
      → git clone (深度控制)
      → git log 解析 (--format + --numstat)
      → 9 项指标计算
      → metrics_summary 写入
    → 前端轮询至 SUCCEEDED
  → GET /api/v1/dashboard → 渲染看板
```

## 9 项指标

| 指标 | 说明 | 风险维度 |
|------|------|----------|
| 交付吞吐 | 周均有效提交数 | 低于 5 需关注 |
| 交付周期 | 首次到最后提交中位时长（小时） | 超 48h 需关注 |
| 首次评审响应 | 提交间隔中位时间（小时） | 超 24h 需关注 |
| 评审完成时间 | 评审完成中位时间（小时） | 超 72h 需关注 |
| 活跃贡献者 | 提交 ≥5 次的人数 | 少于 2 人风险 |
| Bus Factor 风险 | Top 2 贡献占比（%） | ≥50% 需关注 |
| 热点波动 | 高频文件变更热度（0-100） | ≥70 高波动 |
| 返工率 | 修改已有文件的提交占比（%） | ≥25% 需关注 |
| 项目健康分 | 前 8 项归一化加权分（0-100） | <45 风险 |

## 测试

| 类型 | 命令 | 说明 |
|------|------|------|
| 单元测试 | `pnpm test` | Root 层 smoke + 性能基准测试 |
| Worker 单元测试 | `pnpm --filter @gitinsight/worker test:unit` | Worker 模块单元测试 |
| API 单元测试 | `pnpm --filter @gitinsight/api test:unit` | API 模块单元测试 |
| API E2E | `pnpm --filter @gitinsight/api test:e2e` | NestJS supertest E2E |
| Playwright E2E | `pnpm test:e2e:playwright` | API 独立 E2E（需启动 API + Playwright 浏览器） |
| 性能基准 | `pnpm benchmark` | 指标计算性能测试 |

## 文档

- `docs/superpowers/specs/2026-06-24-gitinsight-v1-design.md` — PRD
- `docs/superpowers/specs/2026-06-24-gitinsight-v1-spec.md` — SPEC
- `docs/superpowers/specs/2026-06-24-gitinsight-quality-standard.md` — 质量规范

## CI

已配置 GitHub Actions 流水线：
- `unit-test` — Worker + API 单元测试
- `integration-test` — API E2E 测试
- `e2e-playwright` — Playwright API E2E 测试
- `docs-quality` — Markdown Lint + 链接检查
