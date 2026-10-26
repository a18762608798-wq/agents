---
description: 根据当前 paper feature specification 生成写作计划。
---

# Plan

## Workflow

1. 读取当前 feature 的 `spec.md`。

2. 读取项目 live constitution，并遵守其中约束。

3. 解析当前生效的 `plan-template`。

4. 根据 `spec.md` 生成 `plan.md`。
   - 严格遵循 plan template。
   - 不重新定义主张或证据绑定。
   - 不修改或补充 spec 中的 Boundary、Sections、Figures、Claim Binding、Gaps、引用要求。
   - 不复制 spec 中已经定义的 Contract；需要引用时使用其稳定 ID。
   - 如果存在阻塞写作的 Open Questions / `GAP-DATA`（关键证据缺失），
     或 spec 缺少必须先确定的主张口径，停止规划并报告应返回 `specify` / `clarify`。
   - 非阻塞缺件（`GAP-DATA` 留空位、`GAP-INTERP` 已有用户推测）不阻止规划，
     在 plan 中写明先行 / 冻结安排。

5. 章节与 skill 映射时：
   - 遵守项目指定的 paper-* skills。
   - 保持 feature 职责边界。
   - Related Work 内容并入 Introduction（PRA 无独立章节）。
   - 作图本身不在本 preset 内；`FIG` 只管放图进文，不管造图。

6. LaTeX 工程决策只记录写作层选择。
   如果某个决定会改变主张或证据指向，应回到 spec 修改，而不是仅写入 plan。

7. 编译与评审方案必须按 spec 中的 `VAL-*` 逐项落实覆盖，不重新定义验收标准。
   编译由 agent 直接执行，不经过 skill。

8. 删除无意义的占位内容和空章节。

完成后报告 `plan.md` 路径，以及是否存在阻塞写作的未解决问题。
