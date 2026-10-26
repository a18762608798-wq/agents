# Constitution

## I. 科学事实的权威来源是 Exp 层，不是 Paper Spec

上游 `scientific-computing`（`specs/expXX`、`S##`、`D##`、
`docs/expriment-map.md`）拥有实验定义与结果含义的最终解释权。

Paper Spec 只负责当前 feature 如何选取、组织和表述已有结果：
写什么范围、按什么顺序、用什么证据、缺什么。不得擅自改变
实验结果的含义或结论口径。

模型可以提出新的物理解释或结论建议，但须经作者确认；
一旦涉及科学结论、实验定义或结果含义变化，应暂停相关写作、
回到上游核实，并更新受影响的规范，不得在 Paper 层静默转正。

Spec 是持续维护的活文档，而不是一次性交付物。

## II. 核心主张必须可追溯，不逐句验收

- `CLM-###` 只追踪需要明确管理的核心科学主张，不是每个句子
  都要绑定一个 `Dxx`。数值结果须可追溯到数据、图和分析产物
 （`D##` / `figs/` / `S##`）；理论推导与背景论述可依据理论文档
  和已核验文献（`paper-zotero-hunter` verify 标准）。
- 无证据的核心主张不得以陈述句写入正文，只能以缺件（`GAP-###`）
  或标记的推测形式存在（见 IV）。
- 所有数字必须能在上游实验记录中溯源；禁止编造数字、p 值、
  引用、图表。重点是科学准确性与可追溯性。

## III. 上游、成文与实现分离

- 上游 `scientific-computing`：实验定义与数值结果（`specs/expXX`、`S##`、`D##`）
- 本 preset 的 `spec.md`：论文定义（主张什么、用什么证据、缺什么）
- `plan.md`：章节→skill 映射与 LaTeX 工程方案
- `tasks.md`：具体写作与评审工作

上游实验定义不应重复写入论文 spec，需要时引用其 ID。
LaTeX 细节（宏包、编译命令）不应无必要进入 spec。

## IV. 缺件协议

缺件分两类，处理方式不同：

- `GAP-DATA`（缺数 / 缺图）：正文对应位置留
  `[TODO(GAP-###): 待 D##]` 空位，与之相关的主张冻结，
  不得用模糊措辞绕过。能写的部分（方法、背景、格式）先行。
- `GAP-INTERP`（依赖结果的解释性正文）：向用户要推测，
  写入 `[推测(user, 待 D## 验证)]` 并记录提出者与日期。
  推测在数据落定前不得改写为事实语气；
  `converge` 时必须转正（证据到位）或降级（删除 / 改为开放问题），
  不得过夜成事实。

## V. 引用必须来自读过的文献

- 每个引用（`CIT-###`）必须对应 Zotero 库中条目，
  且已通读到足以确认支撑引用处具体论述的程度（`paper-zotero-hunter`
  的 verify 标准）。
- 禁止为凑引用数量而引用未读文献；禁止编造 BibTeX。

## VI. Spec 必须清晰且可验证

- Spec 应区分面向作者的纸面描述与具有规范性的约束，并保持两者一致。
- 规范性约束应采用足以消除歧义、支持验证的最低必要形式化程度。
- 不得用多个彼此独立的表述重复定义同一规范性约束。

## VII. 变更处理（避免返工重走全流程）

- 只调整章节顺序、段落安排或正文与附录组织方式：更新
  `paper-map` 和必要的 `plan`，继续写作。
- 涉及科学结论、实验定义或结果含义变化：暂停相关写作，
  返回 Exp 层核实，并更新受影响的规范。
- 涉及 feature 边界或验收要求变化：只更新受影响的 spec 和
  tasks，不要求整篇从头重走。

## VIII. 论文展开规则

以确认后的 `docs/paper-map.md`（由 `paper-map` skill 经架构访谈生成，
`Dxx` 定义以 `docs/expriment-map.md` 为准）为论文切分依据。

- 论文结构由 map 的 Narrative Spine / Section Architecture /
  Result Roles 决定，Constitution 不预设固定三段式。
  `paper-01 = Methods`、`paper-02 = Results and Discussion`、
  `paper-03 = Closing` 只是可能的划分之一；附录定位在架构设计
  阶段确定，具体实施可延后。
- Venue 公认规范（如 PRA 章节习惯）由对应 Skills 负责；
  无唯一标准答案的取舍由作者经架构访谈确认，记入 map 的
  Confirmed Decisions / Open Issues。
- 一次展开一个 feature，每个走一轮完整 specify 流程
 （specify → clarify → plan → tasks → analyze → implement → converge）；
  不得以单个实验、图或 Dxx 单独创建 paper feature；
  不得在 spec 之外另行定义核心主张与证据归属。
- Feature 是工作流组织单元，不必与最终论文章节一一对应。

## IX. 论文技术与风格约定

| 域 | Skill |
| --- | --- |
| 全流程调度与缺件检查 | `paper-assembly` |
| 分节写作 | `paper-writing-section` |
| Related Work 对比 | `paper-writing-section`（Related Work 模式） |
| 组图进文（位置） | `paper-figure-layout` |
| 引用（Zotero 查缺 / 精读 / 入库） | `paper-zotero-hunter` |
| 套格式与 venue 规范（含 PRA） | `paper-latex-formatting` |
| 打分 | `paper-self-review` |
| 按意见改文 | `paper-revision` |

编译（`latexmk`）由 agent 直接执行，不经过 skill。
LaTeX 论文目录约定：`docs/paper/`（`main.tex`、`references.bib`、`figures/`、`output/`）。
