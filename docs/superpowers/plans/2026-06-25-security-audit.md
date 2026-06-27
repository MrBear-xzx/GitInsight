# 安全审计

**日期**: 2026-06-25
**状态**: ✅ 已完成

## 目标

审计并加固项目安全：PAT 日志掩码、异常响应过滤、内存清理。

## 改动清单

### 全局异常过滤器
- `apps/api/src/common/filters/global-exception.filter.ts`（新）
- `apps/api/src/main.ts` — 注册全局异常过滤器，非 HttpException 返回通用错误消息

### PAT 安全加固
- `git-clone.service.ts` — 克隆完成后 PAT 变量超出作用域自动释放；错误消息通过 `sanitizeMessage()` 掩码 PAT
- `token-mask.ts` — 已有掩码函数 `maskToken()`，新增单元测试

### 错误码映射优化
- `mapCloneError()` — 先检查 rate limit，再检查 code 128，避免误判

### 测试
- `token-mask.spec.ts`（新）— 4 个用例覆盖正常/短/空/4字符 token
- git-clone 的 rate limit 测试用例修复（无 code=128 模拟真实错误结构）

## 验证

- pnpm --filter @gitinsight/worker test:unit — 11 suites, 36 passed
- pnpm --filter @gitinsight/api test:unit — 10 suites, 17 passed
- pnpm --filter @gitinsight/api test:e2e — 4 suites, 8 passed
