---
description: 从论文主线创建或更新 paper feature specification。
---

# Specify

## User Input

`$ARGUMENTS`

用户输入不能为空（论文主线、目标 venue、大纲或上游实验范围）。

## Workflow

1. 读取项目 live constitution，并遵守其中的全部约束。

2. 以 `docs/paper-map.md` 为切片依据，检查 `specs/` 下已有 paper feature。
   - 如果需求属于现有 feature 的自然扩展，更新该 feature。
   - 只有当需求对应 paper-map 中已确认的独立 feature（见 map 的
     Feature Coverage & Decisions）时才创建新的 feature；
     切分服从 map 的 Section Architecture / Result Roles，
     不套用固定的 Methods / Results / Closing 三段式。
     单个实验、图或 Dxx 不单独创建 feature。
   - 大纲或结果变更时先重跑 `paper-map` skill 更新 map，再开新 feature。
   - 避免创建职责重叠的 feature。

3. 确定 feature directory。
   - 更新已有 feature 时使用已有目录。
   - 新建时按照项目现有命名和编号方式创建目录。

4. 解析当前生效的 `spec-template`。
   - 新建 feature 时以该模板创建 `spec.md`。
   - 更新 feature 时保留已有有效内容，只修改本次需求涉及的部分。

5. 根据用户输入、上游产物（`specs/expXX`、`S##`、`D##`、`figs/`、`docs/paper-outline.md`）
   填写 `spec.md`。
   - 每条主张写 `CLM-###` 并绑定证据；证据不存在不编，记 `GAP-DATA`。
   - 引用需求记 `CIT-###`，不预填具体文献。
   - 不写 LaTeX 实现细节。
