---
description: 澄清论文主张口径，向用户要依赖结果的解释推测。
---

# Clarify

## Workflow

1. 读取当前 feature 的 `spec.md`。

2. 读取项目 live constitution，并遵守其中约束。

3. 检查 spec 是否存在会实质影响后续写作的主张歧义、证据缺口或口径冲突。

   Paper Description 重点检查：

   * 核心主张是否明确、无歧义；
   * 每条 `CLM` 是否有证据绑定，无证据的是否已记 `GAP-DATA`；
   * `GAP-INTERP` 是否列出需要用户解释推测的全部位置；
   * 引用需求 `CIT-###` 是否覆盖全部主张方向；
   * `Open Questions` 中是否存在阻塞性问题。

   Specification Contract 重点检查：

   * 章节清单 `SEC-###` 是否完整（PRA 不单列 Related Work）；
   * 图位 `FIG-###` 与上游图文件是否对得上；
   * 缺件标记是否完整（留空位 + 冻结主张）；
   * 验收 `VAL-*` 是否足以判断成文。

   同时检查 Paper Description 与 Specification Contract 是否一致。

4. 不询问纯 LaTeX 实现层问题，例如：

   * 宏包选什么；
   * 目录怎么拆分；
   * 编译命令怎么写。

   这些属于 plan 或 implementation。

5. 只询问真正需要用户决定且无法从已有上下文可靠确定的问题，
   重点是 `GAP-INTERP`：依赖结果的解释、与文献的对比口径、结论下到什么程度。

   * 每次只问一个问题；
   * 优先处理影响最大的歧义；
   * 最多询问 10 个问题；
   * 已经明确的信息不要重复询问；
   * 可从上下文无歧义推导的表达形式不问，直接整理。

6. 每获得一个明确答案后：

   * 用户的解释推测以 `[推测(user, 待 D## 验证)]` + 提出者 + 日期写入正文对应位置；
   * 推测不得使用事实语气；相关 `GAP-INTERP` 保留（转正要等 converge）；
   * 更新 `spec.md` 中实际受影响的内容，Description 与 Contract 保持一致；
   * 修改已有 Contract 约束时保留其稳定 ID；只有新增独立约束时才创建新 ID；
   * 不因编辑、排序或删除其他约束而重新编号已有 ID；
   * 如果答案解决了 `Open Questions` 中的对应问题，删除该问题；
   * 不额外创建澄清历史章节。

7. 不自行猜测主张内容、证据指向或解释口径。

8. 如果剩余问题只影响 LaTeX 实现方式而不影响 spec，则停止澄清并留给 plan。

9. 完成后重新检查 spec：

   * 是否仍存在阻塞性 Open Questions；
   * 主张与证据绑定是否仍有缺口；
   * Description 与 Contract 是否一致；
   * `VAL-*` 是否足以覆盖关键 Contract；
   * 是否与 constitution 冲突。

如果没有值得正式澄清的关键问题，不修改 spec，直接报告可以继续进入 plan。

完成后报告：

* 更新的 `spec.md` 路径；
* 本次解决了多少个问题（含新增推测数）；
* 是否仍存在阻塞性的 Open Questions / `GAP-DATA`。
