---
name: scientific-project-status
description: Generate self-contained Chinese paper and experiment dashboards at docs/status/paper.html and docs/status/experiments.html from docs/planning/paper-outline.md, docs/planning/experiment-map.md, and specs/. Only run on explicit requests for scientific-project-status, 项目总览, 项目状态, 论文进度, 实验进度, or status dashboards. Color-coded cards and inline SVG, no tables, external dependencies, or JS.
---

# Scientific Project Status

Generate two researcher-facing dashboards. Both are derived artifacts, not sources of truth.

**Never modify** constitution, spec, plan, tasks, code, or experiment outputs unless the user explicitly asks. A path-only migration must preserve status badges, task counts, and scientific content.

## Fixed Paths

Read `docs/README.md` first. All paths below are relative to the project root; actual HTML links are relative to the page in `docs/status/`.

| File | Mainline | Organized by | Answers |
| --- | --- | --- | --- |
| `docs/status/paper.html` | `docs/planning/paper-outline.md` | 论文章节 → Dxx 图/数据 | 论文还差哪张图 |
| `docs/status/experiments.html` | `docs/planning/experiment-map.md` | shared-xx / expXX → Sxx / Dxx | 实验跑到哪一步 |

Create `docs/status/` if needed. Do not generate root-level dashboards or duplicate planning documents. If `docs/README.md` is absent, create the navigation using the preset README's fixed layout.

The paper page reports readiness of the outline's figures and data. It does not report completion of prose, literature verification, or formal theoretical argument. Do not require Paper specs, Paper task lists, or a paper-map to generate it.

Both pages are self-contained HTML (inline CSS and hand-written inline SVG), openable offline. Add navigation to `../README.md` and the sibling dashboard (`paper.html` / `experiments.html`). Old dashboards are not silently removed or duplicated; migration/removal needs an explicit user request, and README / publishing links must then be updated together.

## The Three Information Sources

1. `docs/planning/paper-outline.md`: paper content and Dxx requirements in narrative order.
2. `docs/planning/experiment-map.md`: Data Products, Coverage, Intermediates, experiment ownership and dependencies.
3. `specs/<feature>/`: `spec.md` defines experiments, `plan.md` records implementation, and `tasks.md` records task progress.

A Dxx in the outline must resolve through the experiment-map Coverage table. If no producer resolves, mark it `未开始` and say so; do not guess a producer. Do not invent IDs, sections, features, or completed results.

## Status Determination

Apply per Dxx / Sxx using **both artifacts and task checkboxes**.

| Status | Condition | Color |
| --- | --- | --- |
| 已完成 | Owning feature exists, all tasks producing the item are checked, and required artifacts exist | green `#c6efce` / `#2e7d32` |
| 进行中 | Spec/plan exists with partial tasks, or checked tasks still await artifacts with run evidence | yellow `#ffeb9c` / `#9c7d00` |
| 未开始 | No feature owns the item yet | gray `#e2e2e2` / `#666` |
| 阻塞 | Checked tasks lack artifacts and run evidence, a blocking Open Question stops the item, or validation reports FAIL | red `#ffc7ce` / `#9c0006` |

Check the required `data/<feature>/` and/or `figs/<feature>/` artifacts. Neither checked tasks nor an existing file alone prove a validated result.

Evidence is for determining status, not for printing on cards. Do not print evidence paths, script names, validation outputs, errors, data directories, or function/code relationships. Cards contain only a title, one short description, status, ownership/outputs where applicable, and links.

## Reading Order

Read what exists; do not invent generic Spec Kit `research.md`, `data-model.md`, or `contracts/` contents that this preset does not produce.

1. `docs/README.md`, then both planning files.
2. `.specify/memory/constitution.md` and `.specify/feature.json`.
3. `specs/*/spec.md`, `plan.md`, `tasks.md`.
4. `data/` and `figs/` as artifact evidence.
5. `scripts/verify_*.jl`, `test/runtests.jl`, and relevant validation evidence; run cheap checks when appropriate.
6. `docs/experiment-notes/` only for correct terminology, not new derivations.
7. `git status` and `git log --oneline -20`.

## Content and Language

Chinese by default, with Chinese headings and unchanged technical IDs (`Dxx`, `Sxx`, `VQE`, `spec.md`). One fact per card; cross-reference rather than repeat. Missing information is `无` / `Unknown`, not invented history.

Only current effective facts appear. Do not recount obsolete parameters, invalid data, fixed bugs, revoked choices, or closed risks. Only still-blocking issues get a blocked card. Do not expand derivations, convergence tables, or historical assumptions. Do not restore the retired five-block report or a “去哪看” section.

## Paper Page

Write `docs/status/paper.html`, top to bottom:

1. Header, update date, navigation, legend, and one sentence: numbering follows the outline, ownership follows experiment-map, status follows tasks plus artifacts. Link the mainline via `../planning/paper-outline.md`.
2. Mainline inline SVG: 4–8 paper-section nodes, Dxx children, narrative arrows, status colors.
3. Cards grouped by paper section: Dxx title/meaning from the outline, status, producing experiment resolved from Coverage, spec links and links to every definitive completed figure. No evidence dump.

## Experiment Page

Write `docs/status/experiments.html`, top to bottom:

1. Header, update date, navigation, legend, and the corresponding experiment ownership/status rule. Link the mainline via `../planning/experiment-map.md`.
2. Dependency inline SVG: 4–8 shared-xx / expXX nodes, Sxx / Dxx labels, arrows from producer to consumer, status colors. No solver-level or function-level graphs; do not integrate Graphify.
3. Feature cards: title/goal from spec, status, outputs and upstream inputs, a CSS progress bar with task counts, spec links and links to every definitive completed figure.
4. Sxx intermediate cards matching experiment-map Intermediates: definition, producer, status, links.

## Link Rules and Verification

- A card's owning spec link is `../../specs/<feature>/spec.md`, not `specs/...`.
- Figure links are `../../figs/<feature>/<file>.png` (or another existing definitive image).
- Planning links are `../planning/...`; navigation is `../README.md` and the sibling page name.
- The same product uses the same figure links on both pages; link every definitive figure/panel rather than only the first one.
- Resolve every local `href` / `src` against the HTML file's parent and verify that the target exists. Do not generate dead links; if there is no feature, say `无对应 feature`.
- Do not use a root-relative `/specs/...` path: it breaks offline viewing and project-subpath hosting. No `<base>` workaround.
- Publishing retains the project's configured site root; README online URLs must include `docs/status/` when publishing from the project root.

## Visualization Rules

- **No Markdown tables in generated HTML**, no tables disguised as lists. Use cards, progress bars, timelines, and link chips. Tables in this instruction document are not output templates.
- **Self-contained**: CSS inside `<style>`, graphics in hand-written `<svg>` (`rect`, `text`, `line`, `path`). No Mermaid, CDN, external fonts/scripts, or JS. CSS progress bars only.
- At most two inline SVGs per page, including the required mainline/dependency SVG. Each has 4–8 top-level nodes. Escape bare `&`, `<`, `>` in text.
- Use the four status colors consistently for cards, badges, SVG nodes, and bars.
- Keep cards concise: title, one sentence, badge, allowed ownership/output information, and links. Do not show technical evidence or historical commentary.

## When to Run

Only on explicit requests such as “用 scientific-project-status 生成项目总览”, “更新论文/实验看板”, or “论文还差哪些图”. Do not auto-run for unrelated coding, roadmap, or spec work. A user-requested layout migration changes paths and links without recalculating progress unless separately requested.
