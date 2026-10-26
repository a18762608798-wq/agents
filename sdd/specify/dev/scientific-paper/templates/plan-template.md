# Writing Plan: [FEATURE NAME]

> 章节顺序与论证功能服从已确认的 `docs/paper-map.md`。
> plan 只落实 map，不重做架构设计。

## 1. 写作思路

整体准备怎么把 spec 写成论文。

包括：

- 章节顺序与依赖（以 paper-map 的 Section Architecture 为准，
  不预设 Methods 必须先于 Results，按 map 的叙事主线走）
- 上游产物到章节的数据流（哪个 `D##` 进哪节、哪张图，引用 `CLM/FIG` ID）
- 缺件章节的先行 / 冻结安排（`GAP-DATA` 留空位先行，`GAP-INTERP` 等用户推测）

需要关联 spec 中的约束时引用其 ID，不重复定义 Contract。

## 2. 章节与 Skill 映射

说明每个 `SEC-###` 由哪个 skill 执笔（分工以 map 为准，
具体写法与格式交给对应 Skill）：

例如：

- `SEC-001`（...）：`paper-writing-section`（...模式），输入 `D##` + 上游 `P##`
- `SEC-002`（...）：`paper-writing-section`（...模式），输入 `D##` + `figs/...`
- Related Work 段落：`paper-writing-section`（Related Work 模式；PRA 并入 Introduction，不单列）
- 图位：`paper-figure-layout`（`FIG-###` 用途 → 具体单栏 / `figure*` / 并排由该 skill 定）
- 引用：`paper-zotero-hunter`（`CIT-###` → harvest / verify / bind）
- 格式：`paper-latex-formatting`（venue 模板 + `pra-notes.md` / `pra-figures.md`）
- 打分 / 改文：`paper-self-review` / `paper-revision`

## 3. LaTeX 工程结构

- 论文目录：`docs/paper/`（`main.tex` 英文投稿版 + `main-zh.tex` 中文归档版，
  共用 `references.bib` 与 `figures/`；中文版必须 xelatex 编译）
- 上游图文件引用方式：复制 vs 符号链接进 `figures/`（二选一并写理由）
- 主文件结构：单文件 `main.tex` 还是 `sections/*.tex` + `\input`
- 文献库：`references.bib` 由 skill 维护，手写条目禁入

如果某项选择会改变主张、证据指向或 Contract，
则它不属于 plan，应返回 spec 明确定义。

## 4. 编译与评审方案

- 编译：agent 直接 `latexmk`（`paper-latex-compile-qa` 已卸载，不经过 skill），
  引用与缺图预检顺手做掉
- 评审：`paper-self-review` 打分 → `paper-revision` 按意见改 →
  重编译 → 再打分，直到分数达标或用户喊停
- 按 spec 中的 `VAL-*` 引用，不重新定义验收标准

## 5. 写作层未解决问题 / 延后工作（按需）

只记录不改变 spec、且不阻塞当前写作规划的问题。

- ...

如果问题涉及主张、证据、Contract 或引用要求，
不得记录在这里，应返回 spec 处理。
