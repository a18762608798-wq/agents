# PRA Formatting Spec (from the official REVTeX 4.2 Author's Guide)

Source: `auguide4-2` in the REVTeX 4.2 distribution
(local: `/usr/share/texlive/texmf-dist/doc/latex/revtex/auguide/`).
Template: `templates/pra/main.tex`.

## Class line

```latex
\documentclass[aps,pra,reprint,groupedaddress]{revtex4-2}
```

- `pra` selects Phys. Rev. A; it also auto-selects the `apsrev4-2.bst`
  BibTeX style — do NOT add `\bibliographystyle` unless overriding.
- `reprint` = two-column final-layout approximation (project default:
  always write and check in `reprint`).
  `preprint` = single-column draft; use ONLY for review-friendly
  single-column drafts, never as the default.
  `reprint` is only an approximation (fonts/figure rescaling differ);
  do NOT treat its page count as the final published length.
- `groupedaddress` groups authors by affiliation (default for most
  journals); `superscriptaddress` numbers affiliations (needed for
  long author lists, collaborations, many overlapping affiliations).
- Draft helpers: `draft` marks overfull boxes black; `showkeys`
  prints keywords; `preprintnumbers` displays `\preprint{}` report
  numbers (max ~3 fit on the title page). `preprint` alone does NOT
  show preprint numbers.

## Front matter order (mandatory)

title → authors/affiliations (`\email`, `\thanks`, `\homepage`,
`\altaffiliation` attach to the current author) → `\date` →
`abstract` → `\keywords` (optional; APS authors don't need it) →
`\maketitle`. `\maketitle` MUST come after all of the above.
GOTCHA (verified 2026-10-06, TeX Live revtex4-2): `\thanks` MUST go
OUTSIDE the braces — `\author{Name}\thanks{...}`, NOT
`\author{Name\thanks{...}}` (the latter is silently dropped: no mark,
no footnote, no warning). Same for `\email` placement habits.

## Citations (natbib, numeric superscript for APS)

- `\cite{key}` → superscript number (APS style).
- `\onlinecite{key}` → number on the line, e.g. `Ref.~\onlinecite{key}`.
- Never hand-write the bibliography; always BibTeX + `\bibliography{}`.

## Floats and long equations

- Figures/tables go inline as floats; `figure*` / `table*` span the
  full page width in two-column mode.
- `widetext` drops a long equation to single-column width. It has NO
  effect under `preprint` (already single-column); use sparingly.
- Tables: `ruledtabular` + `tabular`; landscape floats go inside
  a `turnpage` environment.
- Appendices: `\appendix` (use `\appendix*` for a single appendix).
- Acknowledgments: `\begin{acknowledgments}` (no "e" after "g").

## Length

- PRA regular articles: no hard page limit; keep it concise.
  `reprint` page count is approximate, not the published length.
- Short formats (Brief Reports etc.) DO have limits — check the
  current APS author guidelines before submitting as one.

## Bilingual output (project convention)

- English `main.tex` (submission) + Chinese `main-zh.tex`
  (archiving/reading) share `figures/` and `references.bib`.
- The Chinese twin needs xeCJK + a CJK font and MUST build with
  xelatex; keep section/label keys parallel (`fig:D01` etc.) so
  cross-checking EN/ZH is trivial.
