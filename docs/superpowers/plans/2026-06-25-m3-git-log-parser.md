# M3.2: 提交日志解析引擎

**日期**: 2026-06-25
**状态**: ✅ 已完成

## 目标

解析 `git log` 输出为结构化提交记录，支持按时间窗口过滤，为后续指标计算提供数据源。

## 改动清单

### 新增文件
- `apps/worker/src/services/git-log-parser.service.ts` — 日志解析引擎
- `apps/worker/test/git-log-parser.service.spec.ts` — 单元测试

### 核心能力

| 能力 | 说明 |
|------|------|
| git log 调用 | `--format=%H\|\|%an\|\|%ae\|\|%ai\|\|%s` + `--numstat` |
| 时间窗口过滤 | `--since` 参数：30d/90d/180d |
| 结构化输出 | `CommitRecord[]` 含 hash/author/email/timestamp/message/files/additions/deletions |
| 文件变更统计 | 解析 numstat 行累加 additions/deletions |
| 时间范围计算 | 自动计算实际 commit 时间区间 |
| 空日志处理 | 窗口内无 commit 时返回空数组 |

### 测试覆盖
- 正常解析 3 条记录及字段验证
- git log 参数验证
- 空日志处理
- 无文件变更的 commit
- git exec 错误映射

## 验证

- `pnpm --filter @gitinsight/worker test:unit` — 8 suites, 23 tests PASS
