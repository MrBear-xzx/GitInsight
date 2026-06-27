# GitInsight 部署指南

## 目录

1. [环境要求](#1-环境要求)
2. [快速部署](#2-快速部署-docker-compose)
3. [生产部署](#3-生产部署)
4. [环境变量说明](#4-环境变量说明)
5. [反向代理](#5-反向代理-nginx)
6. [维护操作](#6-维护操作)
7. [故障排查](#7-故障排查)

---

## 1. 环境要求

| 组件 | 版本要求 | 说明 |
|---|---|---|
| Docker | >= 24.0 | 容器运行时 |
| Docker Compose | >= 2.20 | 容器编排 |
| Git | >= 2.30 | 仓库克隆(Worker 容器内) |
| 内存 | >= 4GB | 建议 8GB+ |
| 磁盘 | >= 10GB | 视分析仓库数量而定 |


## 2. 快速部署 (Docker Compose)

适用于本地开发或小团队试用：

```bash
git clone https://github.com/MrBear-xzx/GitInsight.git
cd GitInsight
cp .env.example .env
docker compose up -d
```

启动后访问：

- Web 前端：`http://localhost:3001`
- API 服务：`http://localhost:3000`
- API 文档：`http://localhost:3000/docs`

## 3. 生产部署

### 3.1 准备环境

```bash
cp .env.example .env
# 编辑 .env，设置生产环境值
```

### 3.2 使用生产配置启动

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker compose ps
```

### 3.3 生产配置说明

docker-compose.prod.yml 覆盖以下内容：

- **资源限制**：各服务内存上限
- **重启策略**：`unless-stopped`
- **日志轮转**：10MB / 3 文件
- **环境变量**：通过 env_file 注入

### 3.4 扩容 Worker

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale worker=3
```

## 4. 环境变量说明

| 变量 | 默认值 | 说明 |
|---|---|---|
| DATABASE_URL | postgres://... | PostgreSQL 连接 |
| REDIS_URL | redis://... | Redis 连接 |
| ANALYSIS_JOB_STORE | memory | 存储方式 memory/prisma |
| ANALYSIS_JOB_DISPATCH_MODE | queue | 分发模式 inline/queue |
| ANALYSIS_JOB_QUEUE_EXECUTION_MODE | inprocess | 执行模式 inprocess/bullmq |
| SCHEDULED_ANALYSIS_ENABLED | false | 定时分析开关 |
| NEXT_PUBLIC_API_URL | `http://localhost:3000` | 前端 API 地址 |
| PORT | 3000 | API 端口 |

## 5. 反向代理 (Nginx)

参考配置位于 deploy/nginx.conf。

### 5.1 启用配置

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/gitinsight
sudo ln -s /etc/nginx/sites-available/gitinsight /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 5.2 HTTPS（建议）

推荐 Certbot 申请 Let''s Encrypt 证书：

```bash
sudo certbot --nginx -d your-domain.com
```

## 6. 维护操作

### 6.1 更新服务

```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### 6.2 查看日志

```bash
docker compose logs -f api
docker compose logs -f worker
docker compose logs -f web
```

### 6.3 数据备份

```bash
docker exec gitinsight-postgres pg_dump -U gitinsight gitinsight > backup_DATE.sql
```

### 6.4 健康检查

```bash
docker compose ps
curl http://localhost:3000/health
```

## 7. 故障排查

### 服务无法启动

```bash
docker compose logs api
docker compose logs worker
docker compose exec postgres pg_isready -U gitinsight
```

### 分析任务失败

1. 检查 Worker 日志：docker compose logs worker
2. 确认仓库可访问（私有仓库需配置 PAT）
3. 检查磁盘空间：docker system df

### 端口冲突

修改 .env 中的 PORT 或调整 ports 映射。
