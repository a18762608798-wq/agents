---
name: speckit-rework
description: 在同时含 .specify/ 和 specs/ 的项目中，对已经实现过的 feature 做普通修改、修复或重构时使用。通过七个 speckit_rework_* MCP 工具进行影响评估、阶段门禁和修改范围控制；不用于正常 /speckit.* 新功能流程。
---

# Spec Kit 返工

1. 确认插件已启用、MCP `speckit_rework` 已连接，并在 Codex `/hooks` 中审核信任 `speckit-rework` 的所有 hooks。若未信任，停止并提示用户审核，不使用危险的 hook-trust bypass。
2. 调用 `speckit_rework_list_features`，选已有且具备 spec、plan、tasks、至少一个已完成任务的 feature，再调用 `speckit_rework_select_feature`。不要创建 feature 或切 Git 分支来规避返工。
3. 调用 `speckit_rework_assess_impact`，传入 `affectedStages`、`summary` 和非空 `scope`（仓库相对路径 glob）。解释未受影响阶段的理由。下游依赖会自动加入。
4. 按 spec、plan、tasks、checklists 的顺序，只修改当前开放的阶段并调用 `speckit_rework_gate`。`update` 必须有相应文件变化；`no-change` 必须保持文件不变；checklists 必须通过。
5. `implementation-open` 后，仅用原生 `apply_patch` 修改 scope 内文件。不要用 shell、外部 MCP、交互式终端或子代理绕过。spec 工件冻结；tasks 勾选只用 `speckit_rework_complete_task`，不能改任务文字。
6. 实现结束调用 `speckit_rework_close`。关闭后继续修改需要重新 select + assess。事务 blocked 时先调用 `speckit_rework_reset` 并说明原因。

## 工具与会话身份

此版本 Codex 的工具前缀为 `mcp__speckit_rework__`，以工具发现结果为准。七个工具的短名称沿用 Pi：list_features、select_feature、assess_impact、gate、complete_task、close、reset，前缀均为 `speckit_rework_`。

`_codex_gate_token` 是可信 PreToolUse hook 注入的一次性传输字段。模型调用工具时必须省略；不要填 session id、伪造 token，或直接运行插件脚本来改变状态。

## 边界

* 只有以真实 `/speckit.*` 命令开头的用户提示才旁路；提及命令名称不会清除事务。
* 同一会话的 resume/compact 保留状态；fork 不继承 implementation-open，首次修改需重新评估。
* 事务期间 shell 只允许能安全识别的同步只读操作；写入请用 apply_patch。测试、构建等未知 shell 命令也可能被拒绝，不能临时关闭门禁绕过。
* hooks 依赖宿主执行与信任，并不是 OS 沙箱；宿主跳过 hook、已有后台进程、用户手工修改、禁用插件等不在该门禁的强制边界内。保留 Codex 沙箱。
