# M3.1: Git 克隆服务

**日期**: 2026-06-25
**状态**: ✅ 已完成

## 目标

Worker 中实现 Git 仓库克隆模块，从远程克隆到本地临时目录，为后续提交日志解析与指标计算提供数据源。

## 改动清单

### 新增文件
- `apps/worker/src/services/git-clone.service.ts` — 克隆服务核心模块
- `apps/worker/test/git-clone.service.spec.ts` — 单元测试

### 核心能力

| 能力 | 说明 |
|------|------|
| 公开仓库克隆 | `git clone --depth N` 支持 |
| 私有仓库克隆 | PAT 嵌入 URL：`https://x-access-token:{PAT}@github.com/org/repo` |
| 时间窗口深度映射 | 30d → 1000, 90d → 3000, 180d → 6000 |
| 临时目录管理 | `os.tmpdir()/gitinsight-{uuid}`，失败自动清理 |
| 超时控制 | 5 分钟超时 |
| 错误码映射 | `REPO_NOT_FOUND` / `AUTH_INVALID_PAT` / `GITHUB_RATE_LIMITED` / `CLONE_FAILED` |
| 克隆后信息 | 返回 `repoPath` / `commitCount` / `branch` |

### 测试覆盖

- 正常克隆（含 rev-parse + rev-list 后续调用验证）
- PAT 嵌入 URL
- REPO_NOT_FOUND 映射
- CLONE_FAILED 映射（通用错误）
- AUTH_INVALID_PAT 映射
- GITHUB_RATE_LIMITED 映射
- 失败后临时目录清理
- 30d 窗口 depth=1000 验证

## 验证

- `pnpm --filter @gitinsight/worker test:unit` — 7 suites, 18 tests PASS
