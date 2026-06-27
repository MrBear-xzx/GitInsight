# GitInsight 根级 Vitest 扫描范围修复计划（2026-06-25）

## 背景
- 合并 M1 后，根命令 `pnpm test` 会将 `apps/api/test` 与 `apps/worker/test` 下的 Jest 用例交给 Vitest 执行，触发 `describe is not defined`。
- 该问题会导致本地与 CI 中“根级测试”信号失真，影响质量门禁可读性。

## 目标
- 明确根级 `pnpm test` 仅用于仓库 smoke 检查。
- 防止 Vitest 误扫子项目 Jest 用例。
- 增加回归测试，避免后续配置回退。

## 方案
1. 新增根级 `vitest.config.ts`，将 `include` 限定在 `tests/smoke/**/*.{test,spec}.ts`。
2. 显式 `exclude` `apps/**/test/**`，避免 Jest 测试被 Vitest 收集。
3. 新增 smoke 回归用例，校验 `vitest.config.ts` 存在并包含上述关键配置。

## 验证
- `pnpm test`
- `pnpm --filter @gitinsight/worker test:unit`
- `pnpm --filter @gitinsight/api test:unit`
- `pnpm --filter @gitinsight/api test:e2e`

## 风险与回滚
- 风险：若未来新增根级非 smoke 测试目录，需要同步调整 `include`。
- 回滚：移除 `vitest.config.ts` 与对应回归测试即可恢复原行为（不建议）。
