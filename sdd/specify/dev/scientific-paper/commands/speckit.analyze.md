---
description: 只读检查当前 paper feature 的 spec、plan 和 tasks 是否完整、一致并符合 constitution。
---

# Analyze

## Workflow

1. 读取当前 feature 的：
   * `spec.md`
   * `plan.md`
   * `tasks.md`

2. 读取项目 live constitution。

3. 本命令严格只读。不修改 `spec.md`、`plan.md`、`tasks.md`、正文。

4. 检查 Constitution Alignment：
   * 是否有无证据的主张写成了陈述句；
   * 是否有数字无法溯源到上游实验记录；
   * 是否有引用未经 `paper-zotero-hunter` verify；
   * 是否有推测使用了事实语气。

5. 检查 Spec 内部一致性：
   * Paper Description 与 Specification Contract 是否一致；
   * `CLM` 是否都有证据绑定，无证据的是否记了 `GAP-DATA`；
   * `FIG` 与上游图文件是否对得上；
   * Contract ID 是否唯一且引用有效；
   * 是否存在阻塞性的 Open Questions / `GAP-DATA`。

6. 检查 Spec → Plan：
   * plan 的章节→skill 映射是否覆盖全部 `SEC`；
   * plan 是否重新定义或静默修改主张/证据；
   * 缺件先行安排是否与 spec 的 GAP 标记一致。

7. 检查 Plan → Tasks：
   * 各 Phase 任务是否覆盖 plan；
   * 每个适用的 `VAL-*` 是否有实际 Review task；
   * tasks 是否引入 plan 中没有的主张；
   * tasks 是否绕过上游阻塞问题继续实施。

8. 检查端到端覆盖：
   * spec 的关键主张是否有成文路径；
   * `VAL-*` 是否都有执行路径；
   * 是否存在写作看似完成，但 Contract 无法验证的情况。

9. 对发现的问题按严重程度分类（`CRITICAL` / `HIGH` / `MEDIUM` / `LOW`），
   输出简洁报告表，并补充 Contract consistency、覆盖情况与阻塞问题。

10. 不直接修复问题，指出应回哪个阶段：
    * 主张/证据问题 → `specify` / `clarify`
    * 写作设计问题 → `plan`
    * 任务拆分问题 → `tasks`

如果不存在实质问题，明确报告 artifacts 一致，可以进入 `implement`。
