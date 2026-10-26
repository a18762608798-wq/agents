---
description: 根据当前 feature 的 spec 和 plan 生成可执行任务列表。
---

# Tasks

## Workflow

1. 读取当前 feature 的：
   - `spec.md`
   - `plan.md`

2. 读取项目 live constitution，并遵守其中约束。

3. 解析当前生效的 `tasks-template`，据此生成 `tasks.md`。

4. 将 plan 拆成具体、可执行、可验证的任务。
   - 每个任务应描述明确的工作结果。
   - 任务粒度应足以独立完成和检查。
   - 不要为了形式化而生成不必要的任务。
   - 不要机械复制 plan 的章节标题。

5. `Implementation` 只包含实现当前 plan 所需要的工作。
   - 保持 feature 边界。
   - 遵循 plan 中已经确定的模块与技术方案。
   - 不在 tasks 阶段重新设计架构或补充技术决策。
   - 如果 plan 无法执行或缺少必要实现决策，停止拆分并返回 plan。

6. `Validation` 必须覆盖 spec 中全部适用的 `VAL-*` 和 plan 中对应的验证方案。
   - 每个 Validation task 应引用它落实的 `VAL-*`。
   - 一个 task 可以覆盖多个相关 `VAL-*`。
   - 不要求 Implementation task 机械引用所有 `PRE-*` / `POST-*` / `INV-*`。
   - 不重新定义验证标准。
   - 实现任务完成不等于 feature 完成。
   - 必须包含足以判断科学 / 数值结果是否有效的验证任务。

7. 如果拆分过程中发现阻塞性上游问题，不通过 task 绕过：

   - 实验定义、科学参数、Boundary、Contract 或 Validation 存在缺失 / 歧义 → 返回 `specify` / `clarify`；
   - 实现架构、技术选择或模块职责不足以执行 → 返回 `plan`。

   阻塞问题存在时，不生成假定这些问题已经解决的任务。

8. `Follow-up` 仅在存在明确的非阻塞后续工作时生成。
   没有内容时删除该 section。

   `Follow-up` 不得用于容纳：

   - 未解决的科学问题；
   - 缺失的 Contract；
   - 尚未确定的 Validation 标准；
   - 阻塞当前 feature 正确性的实现工作。

9. 删除：
   - 未替换的模板占位符；
   - 空章节；
   - 重复任务；
   - 与当前 feature 无关的任务。

10. 完成前检查：
    - 所有 Implementation 任务均来自 plan；
    - 所有必要 Validation 均被覆盖；
    - 没有新增实验定义；
    - 没有与其他 feature 重复职责；
    - 每个任务都有明确完成条件。

完成后报告 `tasks.md` 路径，以及是否存在阻塞实施的问题。
