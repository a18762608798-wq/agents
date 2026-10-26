# PRA Figure Placement (how figures go INTO the paper)

Sources: REVTeX 4.2 Author's Guide §"Placement of Figures, Tables, and
Other Floats" (local: `.../doc/latex/revtex/auguide/`) + APS "Information
for Contributors" (PRA: figures planned for 8.6 cm column width).
Layout mechanics: `paper-figure-layout` skill. This note is the PRA rules.

## Width planning (APS rule + project default)

- DEFAULT IS SINGLE COLUMN. Design every figure for ONE column =
  8.6 cm (3 3/8 in) with `\includegraphics[width=\columnwidth]{...}`
  inside a plain `figure` environment, as long as all text/lines/markers
  stay legible at that size.
- The ONLY exception is a genuinely large composite that is illegible
  in one column (e.g.\ a $2\times2$ multi-panel figure): then use
  `figure*` + `width=\textwidth` (inside `figure*`, `\textwidth` =
  full page width). Never use `figure*` for single plots, schematics,
  or ranking/placeholder boxes.
- Never go 1.5 columns wide; widths are either 1 column (`figure`)
  or full width (`figure*`), nothing in between.

## Where to put the environment in source

- Put each `figure`/`table` IMMEDIATELY AFTER its first `\ref` in the
  text. Default floats go top/bottom via the standard mechanism;
  placement arg `[htbp]` (`h`=here, `t`=top, `b`=bottom, `p`=float page,
  `!`=override). Start with `[htbp]`, escalate to `[!htbp]`.
- Spanning floats (`figure*`/`table*`) can ONLY sit at the top of a
  page (or the next page top). `[h]`/`[b]` do not work on them —
  never wrap a wide float in `widetext` to fake spanning; use `figure*`.
- `widetext` (long equations) and floats interact badly: a float just
  before `\begin{widetext}` may stick at the column bottom. Fix: move
  the float environment BELOW the `widetext` block.
- `preprint` mode is single-column, so spanning is a no-op there;
  check spanning only in `reprint`/two-column output. Since the project
  default is `reprint`, every `figure*` exception MUST be checked in
  `reprint` output for legibility and top-of-page placement.

## When floats get stuck

- Symptom: floats pile at the document end / `Too many unprocessed floats`.
- First try the `floatfix` class option (emergency float processing;
  REVTeX prints a message suggesting it).
- If still bad, reposition by hand. Do NOT define shortcuts like
  `\def\bt{\begin{table}}` — breaks REVTeX float handling
  (matters with `endfloats`).
- `endfloats`/`endfloats*` hold all floats to the end (via
  `\printfigures`/`\printtables`); APS no longer requires this for
  submission, so default is floats in text.

## REVTeX + subfigures

- `subcaption` works; `subfig`/`subfigure` legacy packages do not mix well.
- In two-column, two `0.45\textwidth` subfigures fit one column only if
  `\textwidth` there means column width (inside plain `figure` it does).
