---
description: 根据当前 feature specification 生成实现计划。
---

# Plan

## Workflow

1. 读取当前 feature 的 `spec.md`。

2. 读取项目 live constitution，并遵守其中约束。

3. 解析当前生效的 `plan-template`。

4. 根据 `spec.md` 生成 `plan.md`。
   - 严格遵循 plan template。
   - 不重新定义实验语义。
   - 不修改或补充 spec 中的 Boundary、Preconditions、Postconditions、Invariants、输出或 Validation。
   - 不复制 spec 中已经定义的 Contract；需要引用时使用其稳定 ID。
   - 如果存在阻塞实现的 Open Questions，或 spec 缺少必须先确定的科学定义，停止规划并报告应返回 `specify` / `clarify`。

5. 规划代码与模块结构时：
   - 遵守项目指定的代码架构 Skill。
   - 保持 feature 职责边界。
   - 优先复用已有稳定能力，避免与其他 feature 重复实现。
   - 不为了抽象而提前创建共享框架。

6. 数值与技术决策只记录实现层选择。
   如果某个决定会改变实验语义或科学结果，应回到 spec 修改，而不是仅写入 plan。

7. 验证方案必须按 spec 中的 `VAL-*` 逐项落实覆盖，不重新定义验证标准。

8. 删除无意义的占位内容和空章节。

完成后报告 `plan.md` 路径，以及是否存在阻塞实现的未解决问题。
