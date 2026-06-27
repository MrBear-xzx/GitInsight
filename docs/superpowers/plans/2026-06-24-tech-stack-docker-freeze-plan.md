# GitInsight 技术选型与 Docker 范围冻结计划（中文）

## 1. 目标
补齐并冻结 GitInsight V1 的技术与框架选型，同时明确 Docker 在 V1 的交付边界，消除后续实施歧义。

## 2. 冻结结果
1. 前端：Next.js + TypeScript + ECharts。
2. 后端：NestJS + TypeScript。
3. 数据层：PostgreSQL + Prisma。
4. 异步与定时：Redis + BullMQ。
5. GitHub 接入：Octokit。
6. 仓库分析：git CLI。
7. 接口文档：Swagger (/docs)。
8. 测试：Vitest/Jest（单元与集成），Playwright（后续 E2E）。

## 3. Docker 范围（V1）
1. 提供开发环境 `docker-compose`：`postgres`、`redis`、`api`、`worker`。
2. 提供后端应用 `Dockerfile`。
3. 不包含 Kubernetes 与复杂多环境编排。

## 4. 验收标准
1. SPEC 中有明确“技术选型冻结”与“Docker 范围”章节。
2. README 同步真实能力说明，不超前承诺。
3. 后续实施计划以本冻结结果为唯一口径。

