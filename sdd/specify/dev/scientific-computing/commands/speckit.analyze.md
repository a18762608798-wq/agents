---
description: 只读检查当前 feature 的 spec、plan 和 tasks 是否完整、一致并符合 constitution。
---

# Analyze

## Workflow

1. 读取当前 feature 的：

   * `spec.md`
   * `plan.md`
   * `tasks.md`

2. 读取项目 live constitution。

3. 本命令严格只读。

   不修改：

   * `spec.md`
   * `plan.md`
   * `tasks.md`
   * 代码

4. 检查 Constitution Alignment：

   * spec、plan、tasks 是否违反 constitution；
   * feature 是否出现明显职责重叠；
   * 是否存在未记录但影响科学结果的隐式条件；
   * 是否存在以性能或实现便利改变科学语义的设计。

5. 检查 Spec 内部一致性：

   * Scientific Description 与 Specification Contract 是否一致；
   * Boundary / Preconditions / Postconditions / Invariants 是否存在关键缺失；
   * Contract ID 是否唯一且引用有效；
   * Validation 是否引用真实存在的 Contract ID；
   * 是否存在多个互相独立的规范性定义描述同一约束；
   * 是否存在阻塞性的 Open Questions。

6. 检查 Spec → Plan：

   * plan 是否足以实现 spec；
   * plan 是否重新定义或静默修改 Contract；
   * plan 是否引入本应先写回 spec 的科学决定；
   * plan 的验证方案是否覆盖全部适用的 `VAL-*`；
   * plan 是否错误地把 spec-level 问题留作实现层未解决问题。

7. 检查 Plan → Tasks：

   * plan 中必要的实现工作是否都有对应任务；
   * 每个适用的 `VAL-*` 是否有实际 Validation task；
   * Validation task 是否引用正确的 `VAL-*`；
   * tasks 是否引入 plan 中没有的实现设计；
   * tasks 是否绕过上游阻塞问题继续实施。

8. 检查端到端覆盖：

   * spec 的关键输出是否有实现路径；
   * `VAL-*` 是否都有执行路径；
   * 是否存在 Implementation 看似完成，但 Contract 无法验证的情况。

9. 检查未解决问题：

   * spec 中是否仍有阻塞性 Open Questions；
   * plan 中是否存在阻塞实现的未解决问题；
   * tasks 是否错误地绕过这些问题继续实施。

10. 检查一致性与漂移：

    * 同一个参数、术语或条件在不同文档中是否含义不同；
    * 已经被 spec 修改的旧设计是否仍残留在 plan/tasks；
    * 是否存在互相矛盾的验证标准；
    * 是否存在重复定义同一职责的内容。

11. 对发现的问题按严重程度分类：

* `CRITICAL`：违反 constitution，或可能导致科学语义错误 / 无法判断结果有效；
* `HIGH`：spec、plan、tasks 之间存在明确冲突或关键覆盖缺失；
* `MEDIUM`：会造成实施歧义、重复工作或明显维护问题；
* `LOW`：非阻塞性的清晰度或结构改进。

12. 输出简洁报告：

| ID | 严重度 | 位置 | 问题 | 应在哪一层修正 |
| -- | --- | -- | -- | ------- |

并补充：

* Contract consistency
* Spec → Plan coverage
* VAL-* coverage
* Unmapped tasks
* Blocking upstream issues

13. 不直接修复问题。

指出问题应回到哪个阶段处理：

* 实验定义问题 → `specify` / `clarify`
* 实现设计问题 → `plan`
* 任务拆分问题 → `tasks`

如果不存在实质问题，明确报告 artifacts 一致，可以进入 `implement`。
