---
name: paper-map
description: Build and maintain docs/planning/paper-map.md from docs/planning/paper-outline.md. Slice the paper into macro-level paper features by final narrative section, usually Methods, Results and Discussion, and Closing, with an optional post-convergence Appendix. Reference Dxx products from experiment-map.md without redefining them. Use when starting a paper project or when the outline changes.
argument-hint: [project-root]
---

# Paper Map Builder

Generate `docs/planning/paper-map.md`: outline section → paper feature → consumed
`D##` → upstream exps → status. Task归属 only, no writing details. Group outline subsections under macro-level final-paper features.

## Input

- `$0` — Project root (contains `docs/README.md`,
  `docs/planning/paper-outline.md` and `docs/planning/experiment-map.md`; defaults to cwd).
- Read `docs/README.md` first; do not create root-level planning copies.

## References (read-only, never rewrite)

- `docs/planning/paper-outline.md` — section order = feature numbering order.
- `docs/planning/experiment-map.md` — authoritative for `Dxx` numbering, meaning,
  and producing exps. Quote `D##` IDs from it; do NOT redefine them.

## Workflow

### Step 1: Read both maps

Parse outline sections in order; group them by final-paper narrative role,
then list the `D##` consumed by each macro feature and look up producing exps
in experiment-map.

### Step 2: Assign features

- Default features are: `paper-01` Methods, `paper-02` Results and
  Discussion, and `paper-03` Closing (abstract, conclusion, unified draft).
- Methods explains models, protocols, algorithms, measurement and mitigation
  mechanisms. It should not contain the concrete experimental conclusions.
- Results and Discussion consumes the result products and states the concrete
  rankings, trends, comparisons, and conclusions. For example, D07 ranking
  results belong here even though the qubit-selection protocol belongs in
  Methods.
- Appendix is a separate presentation boundary when a diagnostic or finite-
  size analysis is supporting evidence rather than part of the main method.
  For example, D02a/b/c finite-size curves and fits belong to an Appendix
  feature, not Methods, when the main text only defines the analysis protocol.
- Multiple outline subsections under one macro section are merged by default.
- `paper-04` Appendix is exceptional: create it only when appendix material
  is independently substantial and only after the main features converge.
- A result product may be consumed by Results even when its generating
  protocol is specified in Methods; method ownership and result ownership are
  intentionally separate.
- Do not create a paper feature for one experiment, figure, or `D##` product.
- Method-only material (no `D`) remains part of Methods or the relevant macro
  feature; it does not automatically create another feature.

### Step 3: Status

- Mark `done` only if `specs/paper-XX/` converged; `todo` otherwise.
- Append `(图未出)` where the producing exp has no `figs/` output yet —
  these become future `GAP-DATA`, never silently dropped.

### Step 4: Write docs/planning/paper-map.md

Sections: `Coverage` table (大纲节/宏观职责 | Feature | 消费 D | 上游实验 | 状态)
plus `Rules` (one feature at a time, same macro section is not split by
default, no claim/evidence defined outside specs, Closing last, Appendix only
after main convergence).

## Rules

- Group multiple outline sections into one macro feature when they belong to
  the same final-paper section, while separating method descriptions from
  their later result conclusions.
- Do not split one macro final-paper section into multiple paper features by
  experiment, figure, or data product.
- Never define `Dxx`/`Sxx` meaning or provenance here — experiment-map owns that.
- Re-run (not hand-edit) when the outline changes. Preserve existing feature
  IDs when the project is already in progress; apply regrouping to a new map
  only after recording a migration note for old specs.
