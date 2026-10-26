# Tasks: [FEATURE NAME]

**Feature:** [FEATURE-ID]

Writing 任务来自 `plan.md`。

Post-Implement Review 任务落实编译后的 self-review 与改文循环，
并覆盖 spec 中对应的 `VAL-*`。这里的 Review 由 `paper-self-review`
和 `paper-revision` skill 执行，不对应独立的 `/speckit.review` 命令。

不得在 tasks 阶段引入新的主张或证据绑定。

## Assemble

- [ ] T001 [paper-assembly] 核对上游 `D##` / `figs/` 到位情况，输出缺件表（`GAP-DATA` / `GAP-INTERP`）

## Write

- [ ] T002 [SEC-...] ...（`paper-writing-section`）
- [ ] T003 [FIG-...] ...（`paper-figure-layout` 组图进文）

## Cite

- [ ] T004 [CIT-...] ...（`paper-zotero-hunter` harvest / verify / bind）

## Format

- [ ] T005 ...（`paper-latex-formatting` 套 venue 模板 + 投前检查）

## Post-Implement Review

- [ ] T006 [VAL-...] Implement 后编译通过（agent 直接 `latexmk`，引用/缺图预检）
- [ ] T007 [paper-self-review] 调用 self-review skill 打分并输出评审记录
- [ ] T008 [paper-revision] 若有可修复意见，调用 revision skill 修改、重编译并复评；无意见则记录无需 revision

## Follow-up（按需）

仅记录明确且非阻塞的后续工作。

- [ ] ...
