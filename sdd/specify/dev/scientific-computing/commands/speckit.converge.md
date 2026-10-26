---
description: 审计当前 feature 的实际实现与结果是否真正满足 spec、plan 和 tasks，并将剩余工作补回 tasks。
---

# Converge

## Workflow

1. 读取当前 feature 的：

   * `spec.md`
   * `plan.md`
   * `tasks.md`

2. 读取项目 live constitution，并遵守其中约束。

3. 检查当前实际状态，包括适用时的：

   * 实现代码
   * 测试
   * validation
   * 正式运行结果
   * 输出文件
   * 运行记录

4. 本命令是审计与任务收敛阶段。

   不直接修改：

   * `spec.md`
   * `plan.md`
   * 实现代码
   * 测试代码
   * 正式实验结果

5. 对照 spec 检查实际状态：

   * Scientific Description 中的目标和输出是否真正实现；
   * feature Boundary 是否被遵守；
   * 正式运行是否满足适用的 `PRE-*`；
   * `POST-*` 是否有实际结果与 validation evidence 支持；
   * `INV-*` 是否有足够证据表明在要求范围内成立；
   * 全部适用的 `VAL-*` 是否真实执行并通过；
   * 是否存在 invalid run 或未处理失败。

6. 对照 plan 检查：

   * 计划中的必要实现是否真实存在；
   * 关键数值与技术决策是否按计划落实；
   * 验证方案是否真正执行；
   * 是否存在计划已写但实际遗漏的部分。

7. 对照 tasks 检查：

   * 已勾选任务是否确实完成；
   * 是否存在“任务已完成但实际行为缺失”的情况；
   * 是否存在实现过程中产生但尚未记录的必要剩余工作；
   * Validation 任务是否有真实证据支持其完成状态。

8. 如果发现实现层面的缺口，将新的、具体可执行任务追加到 `tasks.md`：

   * 实现缺口 → `Implementation`
   * 验证缺口 → `Validation`

   不删除或重写已有任务，不通过修改已完成任务掩盖历史状态。

9. 新增任务必须：

   * 直接对应已存在的 spec / plan；
   * 有明确完成条件；
   * 只描述真正缺失的工作；
   * 不引入新的实验定义或实现设计。

   新增 Validation task 必须对应已有的 `VAL-*`。

   如果实际审计发现某项 Contract 无法验证，
   但 spec 中不存在相应 Validation 定义，
   这属于 spec gap：

   不得在 converge 中自行发明新的 validation requirement，
   应返回 `specify` / `clarify`。

10. 如果发现的问题实际属于上游定义错误，例如：

    * spec 缺少必要科学定义；
    * plan 与 spec 冲突；
    * 需要改变实验参数、输出或 validation；
    * 必须做出新的科学决定；

    不在 `tasks.md` 中自行解决。

    报告该问题应返回：

    * `specify` / `clarify`；或
    * `plan`

    处理。

11. 如果 spec、plan、tasks 与实际实现和结果已经一致：

    * 不新增任何任务；
    * 不为了形式化修改 `tasks.md`；
    * 明确报告 feature 已收敛。

12. 完成后报告：

    * 是否已收敛；
    * 发现的实现缺口数量；
    * 新增的 Implementation / Validation 任务；
    * 是否存在需要返回上游处理的问题。
