# Tasks: [FEATURE NAME]

**Feature:** [FEATURE-ID]

Implementation 任务来自 `plan.md`。

Validation 任务落实 plan 中的验证方案，
并覆盖 spec 中对应的 `VAL-*`。

不得在 tasks 阶段引入新的实验定义或实现设计。

## Implementation

- [ ] T001 ...
- [ ] T002 ...

## Validation

- [ ] T003 [VAL-...] ...
- [ ] T004 [VAL-...] ...

涉及目录 / 文档 / 绘图的 feature，还应从 plan 落实适用的检查：

- 路径符合 `docs/README.md`，规划文件与状态页没有根目录副本；
- Markdown / HTML 链接按所在文件解析，两个看板的图片链接一致；
- 正式出图字体可用、PDF 字体已嵌入、有效字号满足既定标准；
- 中文论文引用 `assets/fonts/noto-serif-cjk/` 中字体且 LICENSE 随附。

仅添加与本 feature 有关的验证任务，不为纯数值任务强加论文编译。

## Follow-up（按需）

仅记录明确且非阻塞的后续工作。

- [ ] ...
