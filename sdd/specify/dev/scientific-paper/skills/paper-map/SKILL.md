---
name: paper-map
description: Architecture interview + docs/paper-map.md generator. Read paper-outline.md, expriment-map.md and Dxx products, propose 2-3 PRA-style narrative options with recommendation, interview the author only on undecided tradeoffs, then record Narrative Spine / Section Architecture / Result Roles / Feature Coverage & Decisions as the downstream Spec Kit basis. Use when starting a paper project or when the outline or results change.
argument-hint: [project-root]
---

# Paper Map Builder — 论文架构访谈与 map 生成

目标不是把实验大纲按顺序分配给 Methods / Results / Closing，
而是先决定：**这些物理结果应该怎样组织，才能成为一篇符合 PRA
写作习惯、具有清晰叙事主线的文章**。生成的 `docs/paper-map.md`
是下游 Paper Spec Kit 的架构依据。

## Input

- `$0` — Project root（包含 `docs/paper-outline.md` 和
  `docs/expriment-map.md`；默认为 cwd）

## References (read-only, never rewrite)

- `docs/paper-outline.md` — 内容清单与初始方案，**不再默认拥有
  最终章节顺序决定权**。
- `docs/expriment-map.md` — `Dxx` 编号、含义、来源的唯一权威。
  引用 `D##` ID，不重定义。
- `Dxx` 产物说明、`specs/expXX`、`S##`、`figs/` 到位情况。
- 项目已有的目标期刊信息与相关 Skills
 （如 `paper-latex-formatting` 的 venue 模板、`paper-zotero-hunter`）。

## Workflow

### Step 1: 读取材料，识别哪些事情已经确定

读全上述材料，区分三类信息：

- 实验层已确定的科学内容（`Dxx` 是什么、由哪个 `expXX` 产生、
  图是否已出）；
- PRA 等专业规范可直接决定的事项（交给 venue / format / figure /
  citation Skills，不占用访谈）；
- 仍需作者判断的论文组织问题（本 skill 只处理这一类）。

`Dxx` 定义与来源仍以 `expriment-map.md` 为准。

### Step 2: 先分析，再提出两到三个架构方案

不要一上来就发问卷。先给出自己的专业判断。

每个方案说明：

- 叙事主线是什么；
- 结果按什么逻辑依次出现；
- 哪些是正文核心，哪些用于辅助解释；
- 哪些适合放附录；
- 优点、代价及其对 feature 划分的影响。

同时给出一个推荐方案和理由。

例如 SSH/VQE 论文：不要直接把各 `Dxx` 分配给 Methods 和 Results，
而应先判断 `D09` 初态选择结果是否适合在 `D08` 真机比较之前出现、
帮助读者理解后续结果，还是应压缩为辅助内容、让真机比较成为正文
重点，再把有实质区别的方案交给作者选。

### Step 3: 只拷问无法由 Skills 决定的问题

- 每轮只提一个最重要的未决问题，附具体选项和推荐意见。
  作者可接受、修改或否决推荐。
- 不问期刊格式、图表排版、引用规范等可由现有 Skills 处理的事项，
  也不重复询问已明确的实验定义。
- 不实质影响论文架构的决定，不为走流程而提问。

围绕三个决策维度展开，不设固定问卷：

| 维度 | 问什么 |
| --- | --- |
| 论文的重心 | 物理问题、方法机制、硬件实验，或它们的主次关系？ |
| 结果的组织方式 | 按物理问题、方法逻辑还是结果间关系推进？ |
| 正文与附录的取舍 | 哪些值得占正文篇幅，哪些压缩或移入附录？ |

### Step 4: 根据确认结果，生成初版 `docs/paper-map.md`

map 记录已确认的论文结构和结果分工，同时保留未解决问题。
后续写作可修订，但不得在没有作者确认的情况下静默改变科学结论。

结构只保留四部分：

```markdown
# Paper Map: [论文简称]

## 1. Narrative Spine

一小段话：物理论证主线是什么，各部分为何按此顺序展开。
这是架构设计，不重新定义实验结论。

## 2. Section Architecture

拟定章节顺序、每节论证功能、主要内容、正文与附录分工。
章节可合并、拆分、调序，不必服从实验大纲原顺序。
附录定位在此确定（何时实施可延后）。

## 3. Result Roles

- `D##`：核心结果 / 辅助结果 / 方法展示 / 附录材料 + 与其他结果的关系
- ...

## 4. Feature Coverage & Decisions

### Coverage

| 大纲节/宏观职责 | Feature | 消费 D | 上游实验 | 状态 |
| --- | --- | --- | --- | --- |
| ... | paper-01 ... | D## | expXX | todo/done（图未出） |

### Confirmed Decisions

- AD-001：...（作者已确认的架构取舍）

### Open Issues

- OI-001：...（尚未解决，不阻塞无关章节先行）
```

Feature 是工作流组织单元，不必与最终章节一一对应。
`paper-01 = Methods` / `paper-02 = Results and Discussion` /
`paper-03 = Closing` 只是可能的划分之一，不是默认硬规则。

## Rules

- Never define `Dxx`/`Sxx` meaning or provenance here — expriment-map owns that.
- `paper-outline.md` 变更或新增 `Dxx` 时重跑本 skill 更新 map；
  已在途 feature 保留已有 ID， regroup 需先记录 migration note。
- 不以单个实验、图或 `D##` 单独创建 feature。
- 方法归属与结果归属可分离（如协议在 Methods，结果结论在 Results），
  但具体切分服从已确认的 map，不套用固定三段式。
- Status：`specs/paper-XX/` 已 converge 才标 `done`，否则 `todo`；
  上游 `figs/` 未出标注 `(图未出)`，下游转为 `GAP-DATA`，不得静默丢弃。
