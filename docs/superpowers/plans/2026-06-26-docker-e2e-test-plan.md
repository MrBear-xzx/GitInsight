# Docker Compose E2E 集成测试计划

## 目标

在完整的 Docker Compose 环境中验证 GitInsight 所有服务（API/Worker/Web/PostgreSQL/Redis）
能够正常构建、启动，并完成核心 API 调用链路。

## 测试范围

| 场景 | 验证点 |
|------|--------|
| 服务构建与启动 | docker compose up -d --build 成功 |
| API 健康检查 | GET /health 返回 200 |
| 创建分析任务 | POST /api/v1/analysis-jobs 返回 202 |
| 任务列表 | GET /api/v1/analysis-jobs 返回 200 且包含已创建任务 |
| Dashboard 指标 | GET /api/v1/dashboard 返回 200 且包含 metrics |
| Web 前端访问 | GET <http://localhost:3001> 返回 200 |

## 执行方式

```bash
# 本地运行（需要 Docker）
pnpm test:docker-e2e

# CI 运行
# 在 app-ci.yml 中 docker-e2e job 自动执行
```

## 注意事项

- Docker build 需要拉取 node:22-alpine 和 postgres:16 / redis:7 镜像
- 测试完成后自动清理容器和卷
- 本地 Windows 环境需要 Docker Desktop
- 该测试不在 pnpm test 中默认执行（因 Windows 无 sleep 命令且 Docker 构建耗时）
