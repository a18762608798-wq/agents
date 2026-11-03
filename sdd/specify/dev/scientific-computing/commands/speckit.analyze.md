---
description: 只读检查指定 feature 或全项目的规范一致性，并核对跨实验的数据归属与依赖。
---

# Analyze

## User Input

`$ARGUMENTS`

## 范围选择

- 输入含“全项目”“整个项目”或 `project` 时，检查全项目。
- 明确指定已有 `specs/<feature>` 时只检查该目录；缺省仅读取 `.specify/feature.json` 确定当前 feature。
- 指针缺失或无效时列出已有 feature 请用户指定；不替用户选择、不创建 feature。
- 全项目范围取 `specs/` 中的 feature 目录与 experiment-map 所列实验的并集；包含缺少 spec/plan/tasks 的条目，明确报告缺件、未映射目录和无法解析的归属，不静默跳过。
- 直接读取显式目录；审计不写 `.specify/feature.json`，不调用会持久化 feature 选择的脚本，不切分支。
- Contract ID 与任务 ID 在所属 feature 内核对唯一性；跨 feature 引用带目录或 feature 名。Dxx/Sxx 按项目映射核对，允许已约定的共建产物。

## Workflow

1. 对选定范围内每个 feature 读取：

   * `spec.md`
   * `plan.md`
   * `tasks.md`

2. 读取项目 AGENTS.md、live constitution、docs/README.md，以及现有大纲与 experiment-map。缺少必要输入时明确报告，继续能独立完成的检查。

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

如果不存在实质问题，仅报告已检查范围内的文档一致性；这不证明代码或正式结果已经通过验证。

## 全项目的跨实验检查

在逐 feature 检查之外，核对：

- 大纲的数据需求、experiment-map 的 Data Products / Coverage / Intermediates 与各 spec 的输出、依赖是否对应；区别数据产品、中间产物与面板，不重编号。
- 每项生产与消费是否有明确归属，共建产物的各部分是否完整；共享能力是否缺失、重叠或职责冲突。
- 生产者与消费者的参数、符号、归一化、边界条件及输入输出约定是否一致。
- 依赖中的缺失生产者、悬空引用和循环，以及上游未决问题对下游的影响。
- 规划中存在但尚未建 feature 的工作列为缺件；未映射的已有 feature 单独列出，不自动新建或删除。

输出一份汇总报告：列出实际检查的全部 feature、跨 feature 问题、证据位置、严重度和应修正的层。
按“文档已对齐、存在偏离、未核验”标明各项状态；缺件或部分覆盖时不得声称全项目已对齐。
报告默认直接回复，不生成额外的项目 spec、任务体系或状态文件，也不自动更新看板。
