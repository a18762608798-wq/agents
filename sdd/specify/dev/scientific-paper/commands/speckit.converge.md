---
description: 审计成文是否真正满足 spec，推测转正或降级，剩余工作补回 tasks。
---

# Converge

## Workflow

1. 读取当前 feature 的：
   * `spec.md`
   * `plan.md`
   * `tasks.md`

2. 读取项目 live constitution，并遵守其中约束。

3. 检查当前实际状态，包括适用时的：
   * `docs/paper/` 下正文与图表
   * 编译产物与报告
   * 打分与改文记录
    * 上游 `D##` 落定情况（对照缺件表）
     * post-implement `paper-self-review` 报告、评分与 `paper-revision` 记录；
       Converge 本身不是 review/revision skill，也不是 `/speckit.review` 命令

4. 本命令是审计与任务收敛阶段。不直接修改：
   * `spec.md`
   * `plan.md`
   * 正文与图表
   * 编译结果

5. 对照 spec 检查实际状态：
   * 每条 `CLM` 是否有真实证据支撑；
   * `FIG` 是否与上游图文件一致；
   * 全部 `CIT` 是否经 verify（已读确认）；
   * 编译是否通过，引用是否齐全。

6. 推测处理（本命令的核心）：
   * 对每个 `[推测(user, 待 D## 验证)]`，检查对应数据是否已落定；
   * 数据到位且支持推测 → 转正为事实陈述，删除推测标记，更新 spec；
   * 数据到位但不支持 → 按用户意见改写或删除，不把错误推测留成文；
   * 数据仍未到位 → 降级为开放问题或删除，不得以事实语气残留；
   * 转正 / 降级都要更新 `spec.md` 的 `GAP-INTERP` 状态（spec 更新不在本命令做，
     报告应返回 `specify` / `clarify` 处理）。

7. 如果发现写作层面的缺口，将新的、具体可执行任务追加到 `tasks.md`：
   * 写作缺口 → Write 区
   * 评审缺口 → Review 区
   不删除或重写已有任务，不通过修改已完成任务掩盖历史状态。
   新增任务必须直接对应已存在的 spec / plan，有明确完成条件，
   不引入新的主张或证据绑定。

8. 如果发现的问题实际属于上游定义错误（主张缺失、证据绑定错误、
   需要新的科学决定），不在 `tasks.md` 中自行解决，
   报告应返回 `specify` / `clarify` 或 `plan` 处理。

9. 如果 spec、plan、tasks 与实际成文已经一致：
   * 不新增任何任务；
   * 明确报告 feature 已收敛。

10. 完成后报告：
    * 是否已收敛；
    * 推测转正 / 降级数量；
    * 新增任务；
    * 是否存在需要返回上游处理的问题。
