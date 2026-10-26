---
description: 根据当前 paper feature 的 spec 和 plan 生成可执行任务列表。
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

5. `Assemble / Write / Cite / Format` 只包含实现当前 plan 所需要的工作。
   - 保持 feature 边界。
   - 遵循 plan 中已经确定的章节→skill 映射。
   - 不在 tasks 阶段重新设计主张或补充证据绑定。
   - 如果 plan 无法执行或缺少必要写作决策，停止拆分并返回 plan。

6. `Review` 必须覆盖 spec 中全部适用的 `VAL-*` 和 plan 中对应的评审方案。
   - 每个 Review task 应引用它落实的 `VAL-*`。
   - 必须包含编译通过、引用齐全、打分达标、意见清零任务。
   - 不重新定义验收标准。
   - 写作任务完成不等于 feature 完成。

7. 如果拆分过程中发现阻塞性上游问题，不通过 task 绕过：

   - 主张、证据绑定、Boundary、Contract 或引用要求存在缺失 / 歧义 → 返回 `specify` / `clarify`；
   - 章节映射或 LaTeX 工程方案不足以执行 → 返回 `plan`。

   阻塞问题存在时，不生成假定这些问题已经解决的任务。
   （`GAP-DATA` 留空位先行是 plan 已安排的，不算绕过；`GAP-INTERP` 无用户推测时算阻塞。）

8. `Follow-up` 仅在存在明确的非阻塞后续工作时生成。
   没有内容时删除该 section。

   `Follow-up` 不得用于容纳：

   - 未解决的主张争议；
   - 缺失的证据绑定；
   - 尚未确定的引用要求；
   - 阻塞成文正确性的写作工作。

9. 删除：
   - 未替换的模板占位符；
   - 空章节；
   - 重复任务；
   - 与当前 feature 无关的任务。

10. 完成前检查：
    - 所有写作任务均来自 plan；
    - 所有必要 Review 均被覆盖；
    - 没有新增主张；
    - 没有与其他 feature 重复职责；
    - 每个任务都有明确完成条件。

完成后报告 `tasks.md` 路径，以及是否存在阻塞实施的问题。
