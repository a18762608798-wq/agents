---
name: scientific-project-status
description: Generate two self-contained status dashboards for Spec Kit managed numerical / scientific-computing projects — PAPER_STATUS.html (mainline = doc/paper-outline.md, organized by paper section and Dxx figure/data products) and EXPERIMENT_STATUS.html (mainline = doc/expriment-map.md, organized by shared-xx / expXX features and their Sxx / Dxx outputs). Every item is color-coded 已完成 / 进行中 / 未开始 / 阻塞 and links to the owning specs/<feature>/spec.md. ONLY use when the user explicitly asks for it — e.g. mentions scientific-project-status, PAPER_STATUS, EXPERIMENT_STATUS, 项目总览, 项目状态, 数值项目状态, 论文进度, 实验进度. Do NOT auto-trigger for general coding, roadmap, or spec tasks. All graphics (inline SVG + CSS cards), no markdown tables.
---

# Scientific Project Status

Generate two researcher-facing dashboards from three information sources. Both are derived artifacts, not source of truth.

**Never modify** constitution, spec, plan, tasks, code, or experiment outputs unless the user explicitly asks.

## The Three Information Sources

Everything written into the dashboards must trace back to one of these. Nothing else is authoritative.

1. **`doc/paper-outline.md`** — the paper's structure. Defines the **Dxx** data/figure products and the order they appear in the paper. This is the mainline of `PAPER_STATUS.html`.
2. **`doc/expriment-map.md`** — the experiment organization. Defines **Data Products (Dxx)**, **Coverage** (which experiment produces which Dxx), **Intermediates (Sxx)**, and per-experiment dependency declarations. This is the mainline of `EXPERIMENT_STATUS.html`.
3. **`specs/<feature>/`** — `spec.md` (experiment definition, outputs, validation), `plan.md` (implementation decisions), `tasks.md` (checkbox state = progress). This is the **status source** and the **link target**.

Cross-check rule: a Dxx listed in `paper-outline.md` must resolve to a producing feature through the `Coverage` table of `expriment-map.md`. If it does not resolve, mark it `未开始` and say so — do not guess a producer.

## Output Files

Both go in the **project root**, both single self-contained HTML (inline CSS + hand-written inline SVG, zero external dependencies, openable offline by double-click).

| File | Mainline | Organized by | Answers |
| --- | --- | --- | --- |
| `PAPER_STATUS.html` | `doc/paper-outline.md` | 论文章节 → 每个 Dxx 图/数据 | 论文还差哪张图 |
| `EXPERIMENT_STATUS.html` | `doc/expriment-map.md` | shared-xx / expXX feature → 其 Sxx / Dxx 产出与依赖 | 实验跑到哪一步 |

If an obsolete single-file `PROJECT_STATUS.html` exists in the project root, tell the user it is superseded and ask whether to delete it. **Do not delete it without confirmation.**

## Status Determination (dual: artifacts + task checkboxes)

Apply per Dxx / Sxx item. Both conditions must be checked; never infer from one alone.

| Status | Badge | Condition | Color |
| --- | --- | --- | --- |
| 已完成 | `已完成` | Owning feature exists, the tasks producing this item are **all checked `[x]`**, **and** the artifacts exist (`data/<feature>/` data files and/or `figs/<feature>/` figure files, whichever the item requires) | green `#c6efce` / `#2e7d32` |
| 进行中 | `进行中` | Feature directory exists (spec/plan written) but tasks are partially checked, **or** tasks are checked while artifacts are still missing | yellow `#ffeb9c` / `#9c7d00` |
| 未开始 | `未开始` | No feature directory owns this item yet | gray `#e2e2e2` / `#666` |
| 阻塞 | `阻塞` | Tasks checked but artifacts missing with no run evidence, **or** the spec carries a blocking Open Question that stops this item, **or** a validation script reports FAIL | red `#ffc7ce` / `#9c0006` |

Rules:

- Task checkboxes alone never prove completion — always check the artifact side (`data/<feature>/`, `figs/<feature>/`) before assigning a status.
- The dual check is for **determining** the status only. **Do not print** evidence paths, script names, validation output lines, error values, data directories, or code relationships on the cards (e.g. never write `data/exp01/exp01_D01.npz`, `scripts/verify_exp01.jl → VERIFY-EXP01-OK`, or `max|Trρ−1| = 1.55e-15`). A card carries only: 标题 + 一句话 + 状态徽标 + 链接.
- An existing file never proves the numbers are validated. Assign the status from tasks + artifacts; print nothing beyond the badge itself.

## Output Language and Conciseness

Write both files in Chinese by default. Headings are pure Chinese. Keep English technical terms as-is (`spec.md`, `D01`, `S01`, `VQE`, `ED`), because artifact keywords stay English.

- One fact lives in exactly one card. Cross-reference instead of restating.
- 无信息处写 `无` / `Unknown` 半句，不追述历史。

## 只写当前有效（负规则）

Applied before writing any block:

- 不写已作废的口径、参数、网格、哈密顿量版本下的数据和结论（连"旧版本已作废"这类话也不要写，直接写当前有效口径）。
- 不写已修复的 bug、已重算覆盖的僵尸数据、已撤销的门、已关闭的决策。只有仍在阻塞当前进展的问题才出现，且只作为 `阻塞` 卡。
- 不在细节技术上深究：不展开公式推导、不列收敛阶表、不列假设清单、不列历史风险清单。每张卡只保留一句话结果 + 状态徽标 + 链接。

## When to Run

Only run when explicitly invoked. Typical invocations:

- "用 scientific-project-status 生成项目总览"
- "生成 PAPER_STATUS / EXPERIMENT_STATUS"
- "论文还差哪些图" / "实验进度到哪了"

If the user did not explicitly request this skill, do not run it.

## Reading Order

Artifact structure follows the `scientific-computing` preset: the generic Spec Kit `research.md` / `data-model.md` / `contracts/` are **not** produced by this preset — never invent their contents.

Read in this order, skipping what does not exist:

1. `doc/paper-outline.md` and `doc/expriment-map.md` (the two mainlines)
2. `.specify/memory/constitution.md` (governance; experiment expansion rule)
3. `.specify/feature.json` (which feature is current)
4. `specs/*/spec.md`, `specs/*/plan.md`, `specs/*/tasks.md`
5. `data/` and `figs/` (artifacts = evidence)
6. `scripts/verify_*.jl`, `test/runtests.jl` (validation evidence; run them when cheap)
7. `doc/theory/` (only to name the physics口径 correctly; never re-derive)
8. `git status`, `git log --oneline -20`

Prefer evidence over inference.

## File 1: `PAPER_STATUS.html`

Layout, top to bottom:

1. **页眉**：标题 + 更新时间 + 一句话口径声明（图/数据编号以 `paper-outline.md` 为准，生产归属以 `expriment-map.md` 为准，状态以 `tasks.md` 勾选 + 产物为准）+ 主线来源行（只链本文件对应的那一个 md：`doc/paper-outline.md` 的相对链接）+ **图例**（四色状态块，纯 CSS，不放表格）。
2. **主线图 SVG**：横向或分层的论文结构图 —— 每个论文章节一个节点，其下挂该章节的 Dxx 节点，按状态着色，箭头表示论文叙述顺序。4–8 个顶层节点，Dxx 用短标签。
3. **按章节分组的卡片**：每个 Dxx 一张卡，只包含：
   - 标题：`Dxx` + 一句话内容（取自 `paper-outline.md` 原文语义，不改写）
   - 状态徽标（四色之一）
   - 生产实验（由 `expriment-map.md` Coverage 解析，如 `exp01`）
   - **链接**：`→ specs/<feature>/spec.md`（相对路径，浏览器可直接跳转）；已完成且有确定图片时，为**每张**确定图片各加一个直链（如 D02 的三联图就加 `→ 图(a)` `→ 图(b)` `→ 图(c)` 三个），点击即看图；与 PAPER_STATUS 中同一产物的链接保持一致
   - 不写证据路径、不写脚本名、不写验证输出、不写数据目录与代码关系

## File 2: `EXPERIMENT_STATUS.html`

Layout, top to bottom:

1. **页眉**：同上，口径声明改为（实验划分与 Sxx/Dxx 归属以 `expriment-map.md` 为准，实验定义以各 `spec.md` 为准，进度以 `tasks.md` 为准）+ 主线来源行（只链 `doc/expriment-map.md` 的相对链接）+ 图例。
2. **依赖图 SVG**：`shared-xx` / `expXX` 为节点，`Sxx` / `Dxx` 为边上的标签，箭头表示数据流向（生产者 → 消费者）。按 feature 状态着色。4–8 个节点。
3. **按 feature 分组的卡片**：每个 feature 一张卡，只包含：
   - 标题：`expXX` / `shared-xx` + 一句话目标（取自 `spec.md §1`）
   - 状态徽标
   - 产出（`Sxx` / `Dxx` 列表）与依赖（上游 `Sxx`）
   - **任务进度条**：`<div>` 宽度实现，文字写在条上，如 `任务 6 / 8`
   - **链接**：`→ specs/<feature>/spec.md`；该 feature 已有确定成图时，为**每张**确定图片各加一个直链，与 PAPER_STATUS 中同一产物的链接保持一致
   - 不写证据路径、不写脚本名、不写验证输出、不写数据目录与代码关系
4. **中间数据清单**：`Sxx` 一组小卡（定义 + 生产实验 + 状态 + 链接），与 `expriment-map.md` Intermediates 表一致；同样不写证据路径。
5. **不生成"去哪看"一节**。

## Visualization Rules（HTML 图形优先，禁用表格）

调研结论：自包含单 HTML（内联 CSS + 手写内联 SVG、零外部依赖）是状态页的标准做法；mermaid 有版本断裂（v9→v10 render 变异步）、解析器误伤非图表代码块、导出 SVG 在浏览器外损坏等已知问题。因此本 skill 禁用 mermaid，一律手写内联 SVG。

硬规则：

- **禁止 Markdown 表格**：不得出现 `| ... |` 表格和用 `*`/`-` 列表伪装的表格。一律用 `<div class="cards">` 状态卡、进度条、时间线、链接 chips 表达。
- **单文件自包含**：全部 CSS 在 `<style>` 内，全部图形为手写内联 `<svg>`（`<rect>` + `<text>` + `<line>`/`<path>` 箭头）。禁止 CDN、禁止外链字体/脚本、**禁止 JS**（进度条用 `<div>` 宽度实现）。离线可看。
- **图形配额**：每个文件最多 2 个内联 SVG（主线图必画 + 依赖/管线选画）。每图 4–8 个顶层节点。SVG 文本只用中文/英文数字空格，禁止 `& < >` 裸写（必须转义为 `&amp; &lt; &gt;`）。
- **状态色板**（卡片徽标、主线图节点、进度条统一）：
  - 已完成 → 绿 `#c6efce` 底 / `#2e7d32` 边字
  - 进行中 → 黄 `#ffeb9c` 底 / `#9c7d00` 边字
  - 阻塞 → 红 `#ffc7ce` 底 / `#9c0006` 边字
  - 未开始 → 灰 `#e2e2e2` 底 / `#666` 边字
- **链接规则**：每张卡必须有一个指向 owning feature 的 `spec.md` 的相对链接；已完成且有确定图片的卡，为**每张**确定图片各加一个相对链接，且同一产物在两个文件中的图片链接保持一致。路径不存在时不要生成死链，改在卡上写 `无对应 feature`。
- 模板骨架（只改文字与颜色，不改结构）：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>PAPER STATUS</title>
<style>
body{font-family:sans-serif;max-width:960px;margin:auto;padding:24px;color:#222;line-height:1.55}
h1{font-size:24px;margin-bottom:4px}
h2{font-size:19px;margin-top:28px;border-bottom:2px solid #eee;padding-bottom:6px}
h3{font-size:15px;margin-top:18px;color:#444}
.sub{color:#666;font-size:13px;margin-bottom:14px}
.legend span{display:inline-block;border-radius:4px;padding:2px 10px;font-size:12px;margin-right:6px}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.card{border:1px solid #ddd;border-radius:8px;padding:12px;border-left:6px solid #666;background:#fff}
.card.done{border-left-color:#2e7d32}
.card.prog{border-left-color:#9c7d00}
.card.block{border-left-color:#9c0006}
.card.todo{border-left-color:#666}
.badge{display:inline-block;border-radius:4px;padding:2px 8px;font-size:12px}
.done-b{background:#c6efce;color:#2e7d32} .prog-b{background:#ffeb9c;color:#9c7d00}
.block-b{background:#ffc7ce;color:#9c0006} .todo-b{background:#e2e2e2;color:#666}
.card .t{font-weight:bold;margin:6px 0 4px}
.card .d{font-size:14px}
.ev{font-family:monospace;font-size:11.5px;color:#555;margin-top:8px;word-break:break-all}
.bar{background:#eee;border-radius:6px;height:22px;overflow:hidden;margin-top:8px}
.bar>div{height:100%;background:#ffeb9c;color:#9c7d00;font-size:12px;line-height:22px;text-align:center}
.chips a{display:inline-block;border:1px solid #ccc;border-radius:16px;padding:4px 12px;margin:4px;text-decoration:none;color:#222;font-size:13px}
svg{max-width:100%;height:auto}
.cap{font-size:12px;color:#666;margin-top:6px}
</style>
</head>
<body>
<!-- header + legend, mainline svg, per-section cards -->
</body>
</html>
```

## Scope Limits

- Do not integrate Graphify. Do not build function-level dependency or large solver dependency graphs — the dependency SVG stays at feature / Sxx / Dxx granularity.
- Do not restate the old five-block report (是什么 / 做了什么 / 正在做什么 / 后面做什么 / 去哪看). It is retired; neither new file has a 去哪看 section.
- Do not invent Dxx / Sxx IDs, paper sections, or feature names. Everything comes from the three sources.
