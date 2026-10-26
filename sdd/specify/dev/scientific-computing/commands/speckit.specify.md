---
description: 从自然语言需求创建或更新科学计算 feature specification。
---

# Specify

## User Input

`$ARGUMENTS`

用户输入不能为空。

## Workflow

1. 读取项目 live constitution，并遵守其中的全部约束。

2. 检查 `specs/` 下已有 feature。
   - 如果需求属于现有 feature 的自然扩展，更新该 feature。
   - 只有当需求具有独立职责时才创建新的 feature。
   - 避免创建职责重叠的 feature。

3. 确定 feature directory。
   - 更新已有 feature 时使用已有目录。
   - 新建时按照项目现有命名和编号方式创建目录。

4. 解析当前生效的 `spec-template`。
   - 新建 feature 时以该模板创建 `spec.md`。
   - 更新 feature 时保留已有有效内容，只修改本次需求涉及的部分。

5. 根据用户输入和现有项目上下文填写 `spec.md`。
   - Part I（`Objective`、`Experiment / Computation Definition`、`Outputs`）用于清晰说明科学目标、实验 / 计算定义和输出，优先保证研究者可读性。
   - Part II 用于记录规范性、可检查的 Contract，不混入实现设计。
   - 两部分必须一致；Part I 中已经由 Contract 精确定义的条件优先引用对应 ID，不重复定义。
   - 不为填满模板而制造信息。

6. 填写 Specification Contract 时：
   - 按语义将约束归入 `Boundary`、`Preconditions`、`Postconditions`、`Invariants` 或 `Validation`。
   - 每条独立约束使用稳定 ID：`BND-*`、`DEP-*`、`PRE-*`、`POST-*`、`INV-*`、`VAL-*`。
   - 数值范围、集合关系、误差界、守恒关系、不变量等数学性质，优先使用数学 notation。
   - 事件、状态、条件响应等行为性质，优先使用 EARS 风格的受控自然语言，例如 `The system shall ...`、`When <trigger>, the system shall ...`、`While <state>, the system shall ...`、`If <condition>, then the system shall ...`。
   - 普通自然语言已经明确、无歧义且可验证时，不为了形式化而形式化。
   - 不用数学公式和自然语言分别重复定义同一规范性约束；可以补充解释，但规范性定义只保留一个来源。
   - `Notation` 只定义当前 feature 特有且理解 Contract 所必需的符号，不解释通用数学符号。
   - `Validation` 应引用被验证的 Contract ID，不通过 validation 重新定义参数、容差或科学条件。

7. 对影响实验语义、结果解释或可重复性的缺失信息：
   - 不自行猜测；
   - 无法可靠确定时记录到 `Open Questions`；
   - 明确区分 blocking 与 non-blocking 问题。

8. 删除无内容的按需章节、未替换的模板占位符和无意义的示例内容。

9. 更新 `.specify/feature.json` 指向当前 feature directory。

10. 检查最终 spec：
    - 与 constitution 一致；
    - Scientific Description 与 Specification Contract 一致；
    - 与已有 feature 无不必要职责重叠；
    - Contract 中的规范性约束清晰、无歧义且可验证；
    - Validation 对关键 Contract 约束具有明确覆盖；
    - 没有同一规范性约束的重复定义；
    - 没有混入 plan 层的实现细节；
    - 没有未经依据猜测的科学参数；
    - 不存在被隐藏在自然语言描述中、但实际影响科学语义或可重复性的条件。

完成后报告 spec 路径，以及是否存在阻塞性的 Open Questions。
