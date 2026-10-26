---
description: 澄清当前 feature specification 中影响科学语义、边界、输出或验证的关键歧义。
---

# Clarify

## Workflow

1. 读取当前 feature 的 `spec.md`。

2. 读取项目 live constitution，并遵守其中约束。

3. 检查 spec 是否存在会实质影响后续 plan、implementation 或 validation 的缺失、歧义或冲突。

   Scientific Description 重点检查：

   * 目标是否明确；
   * 实验 / 计算定义是否足以确定科学语义；
   * 关键输入、参数、初始条件和边界条件是否明确；
   * 输出和 observable 的科学含义是否明确；
   * `Open Questions` 中是否存在阻塞性问题。

   Specification Contract 重点检查：

   * feature 边界与依赖是否明确；
   * Preconditions 是否足以定义合法执行的前提；
   * Postconditions 是否足以判断成功结果；
   * 必要的 Invariants 是否明确；
   * Validation 是否足以验证关键 Contract；
   * Validation 是否正确引用对应 Contract ID。

   同时检查 Scientific Description 与 Specification Contract 是否一致。

4. 不询问纯实现层问题，例如：

   * 文件如何拆分；
   * 使用什么模块结构；
   * API 如何设计；
   * CPU / GPU 如何实现；
   * 普通代码风格选择。

   这些属于 plan 或 implementation。

5. 只询问真正需要用户决定且无法从已有上下文可靠确定的问题。

   * 每次只问一个问题；
   * 优先处理影响最大的歧义；
   * 最多询问 10 个问题；
   * 已经明确的信息不要重复询问；
   * 仅属于措辞、结构整理，或可从已有上下文无歧义推导出的表达形式，不作为澄清问题询问用户，直接整理。

6. 每获得一个明确答案后：

   * 更新 `spec.md` 中实际受影响的内容；
   * Scientific Description 与 Contract 同时受影响时，保持两者一致；
   * 修改已有 Contract 约束时保留其稳定 ID；
   * 只有新增独立约束时才创建新的 ID；
   * 不因编辑、排序或删除其他约束而重新编号已有 ID；
   * 遵循 spec 已有的 Contract 表达方式，不为了形式化而改写已经明确的内容；
   * 如果答案解决了 `Open Questions` 中的对应问题，删除该问题；
   * 删除已经失效或与新答案冲突的旧描述；
   * 不额外创建澄清历史章节。

7. 不自行猜测会改变科学语义的内容。

8. 如果剩余问题只影响实现方式而不影响 spec，则停止澄清并留给 plan。

9. 完成后重新检查 spec：

   * 是否仍存在阻塞性 Open Questions；
   * Scientific Description 是否仍存在影响科学语义的歧义；
   * Scientific Description 与 Specification Contract 是否一致；
   * Boundary / Preconditions / Postconditions / Invariants 是否存在关键缺口；
   * Validation 是否足以覆盖关键 Contract；
   * 是否存在重复或互相矛盾的规范性定义；
   * 是否混入 plan / implementation 层的问题；
   * 是否与 constitution 冲突。

如果没有值得正式澄清的关键问题，不修改 spec，直接报告可以继续进入 plan。

完成后报告：

* 更新的 `spec.md` 路径；
* 本次解决了多少个问题；
* 是否仍存在阻塞性的 Open Questions。
