# Feature: [论文/章节名称]

> 本 spec 分为两部分：
>
> - **Part I — Paper Description**：说明主张、证据、上游输入与缺件，面向作者阅读。
> - **Part II — Specification Contract**：定义章节、图位、主张绑定、缺件与引用需求，作为可检查的规范性约束。
>
> 两部分必须一致；若存在冲突，应先澄清并修正 spec。

## Part I — Paper Description

### 1. Objective

说明本 feature 要写成什么，包括适用时的：

- 核心主张（一句话）；
- 目标 venue（如 PRA）与文章类型；
- 希望读者读完相信什么。

不要在这里写 LaTeX 实现或验收细节。

### 2. Upstream Inputs

列出本 feature 消费的上游产物，引用其稳定 ID：

- 论文架构：`docs/paper-map.md` 对应条目（Narrative Spine /
  Section Architecture / Result Roles）；
- 实验定义：`specs/expXX/spec.md`（`P##` 流程、关键参数）；
- 共享输出：`S##`（...）；
- 数据产物：`D##`（数据集 + `figs/...` 图文件，注明裸图 / 成图）；
- 内容来源：`docs/paper-outline.md` 对应条目（仅作内容清单，
  章节顺序以 paper-map 为准）。

产物不存在或不完全时，不要在这里编造，记入第 5 节缺件表。

### 3. Claims & Evidence

只为需要明确管理的核心科学主张设 `CLM`，每条绑定证据：

- `CLM-001`：... ← `D##` / `figs/...` / `S##`
- `CLM-002`：... ← ...

一般背景、理论推导、过渡性表述不设 `CLM`，由正文准确性与
已核验文献保证。证据缺失的核心主张标 `GAP-DATA` 并冻结，不写正文。

### 4. Sections

本 feature 覆盖的章节（引用 `SEC-###`，定义见 Part II），
顺序与论证功能服从 `paper-map.md`：

- ...（如 Introduction / Methods / Results / Conclusion，或整篇）

### 5. Gaps（缺件表）

- `GAP-001-DATA [blocking]` ...（缺什么数据/图，卡住哪些 `CLM`）
- `GAP-002-INTERP [needs-user]` ...（需要用户给什么解释推测）

非阻塞缺件不得阻止无关章节先行成文。

### 6. Citation Needs（按需）

- `CIT-001`：...（哪个位置需要什么方向的引用）
- ...

### 7. Open Questions（按需）

- `OQ-001 [blocking]` ...
- `OQ-002 [non-blocking]` ...

阻塞性问题未解决时，不得进入依赖该问题的 plan / implementation。

---

## Part II — Specification Contract

本部分只记录具有规范性、可检查意义的约束。每条独立约束使用稳定 ID。

### A. Boundary

#### In Scope

- `BND-001` ...

#### Out of Scope

- `BND-002` ...（如作图本身另起 skill，不管）

#### Dependencies

- `DEP-001` ...（上游 `expXX` / `D##` / 大纲条目）

### B. Sections

定义本 feature 的章节清单与每节输入输出（落实已确认的
paper-map，不在此重做架构设计）：

- `SEC-001`（...节）：输入 ... → 输出 `docs/paper/sections/....tex`（或 `main.tex` 内联）
- ...

### C. Figures

定义图用途与来源，具体排版交给 `paper-figure-layout`，
Contract 不冻结单栏 / 跨栏（`figure*`）/ 并排：

- `FIG-001`：文件 `figs/...` → 支撑 ...节 ...论证（来源 `D##`）
- ...

图文件不存在时，对应 `FIG` 挂 `GAP-DATA`，正文留空位。

### D. Claim Binding

- `CLM-001` ← evidence `[...]`：...（仅核心主张）
- 每条 `CLM` 有且仅有一组证据；证据变更时先更新 spec。

### E. Gaps

- `GAP-001-DATA [blocking]`：缺 ...，冻结 `CLM-...`，正文 `[TODO(GAP-001): 待 ...]`
- `GAP-002-INTERP [needs-user]`：问用户 ...，写入 `[推测(user, 待 ... 验证)]` + 提出者 + 日期

### F. Citation Requirements

- `CIT-001` → 覆盖 `CLM-...` 的 ... 方向：...
- 引用必须经 `paper-zotero-hunter` verify（已读确认），未验证引用不得合稿。

### G. Acceptance

定义什么算写完：

- `VAL-001` → verifies `[SEC/FIG/CLM-...]`：...（如编译通过、引用齐、主张皆有证据）
- ...
