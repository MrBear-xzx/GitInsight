# GitInsight 文档检查流水线计划（中文）

## 1. 目标
建立 GitHub Actions 文档质量流水线，覆盖基础 Markdown 规范检查与仓库内相对链接检查，作为 PR 合并前门禁。

## 2. 范围
1. 触发时机：`main` 分支的 `push` 与面向 `main` 的 `pull_request`。
2. 检查对象：仓库内全部 `*.md` 文档。
3. 检查类型：
   - Markdown 基础格式检查（markdownlint）。
   - 仓库内相对链接有效性检查（自定义脚本）。

## 3. 方案
采用“轻依赖混合方案”：
1. 使用成熟 Action 执行 markdownlint。
2. 使用 PowerShell 脚本检查本地相对链接。
3. 忽略外链（`http(s)`、`mailto`）以降低波动误报。

## 4. 验收标准
1. PR 中 Markdown 违规时流水线失败。
2. PR 中本地相对链接失效时流水线失败。
3. 外链不可达不会导致流水线失败。
4. README 同步新增流水线说明。

