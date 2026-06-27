# GitInsight 部署运维计划

## 完成内容

### Phase 1 — 环境变量 + Healthcheck + 生产 Compose
- .env.example 环境变量模板
- API/Worker Dockerfile 添加 HEALTHCHECK
- docker-compose.prod.yml 生产叠加配置

### Phase 2 — 部署文档与反向代理
- DEPLOY.md 完整部署指南
- deploy/nginx.conf 反向代理配置

### Phase 3 — 健康检查完善
- health.controller.ts 增加 uptime/timestamp
- health.e2e-spec.ts 更新断言

## 待办（暂不实施）
1. 日志聚合（ELK / Loki + Grafana）
2. 监控报警（Prometheus + Grafana）
3. CI/CD 自动部署流水线
