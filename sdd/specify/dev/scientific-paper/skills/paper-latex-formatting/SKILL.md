---
name: paper-latex-formatting
description: Handle LaTeX formatting, templates, and styling for academic papers. Set up conference templates (ICML, ICLR, NeurIPS, AAAI, ACL), fix formatting issues, manage packages, and ensure venue-specific compliance. Use when the user needs to set up a paper template, fix LaTeX formatting, or prepare for submission.
argument-hint: [venue-or-file]
---

# LaTeX Formatting

Set up and manage LaTeX formatting for academic papers.

Read `docs/README.md` for fixed paths. The manuscript belongs in `docs/paper/`,
planning in `docs/planning/`, dashboards in `docs/status/`, and bundled CJK
fonts with LICENSE in `assets/fonts/noto-serif-cjk/`. Do not create root-level
copies. The Chinese template loads fonts by file path from `docs/paper/`;
Local plotting faces belong in `assets/fonts/times-new-roman/` and are
registered by the plotting helper without OS installation; keep their original
licensing notes separate from Noto's SIL OFL. The scientific-paper preset
includes CJK OTFs and LICENSE; scientific-computing includes the four plotting
TTFs. Run the respective preset's `scripts/install-fonts.sh <project-root>`
before template setup. These TTFs are not substitutes for CJK manuscript fonts.

## Input

- `$0` — Action: `setup`, `fix`, `check`
- `$1` — Venue name (for `setup`) or `.tex` file path (for `fix`/`check`)

## Scripts

### Pre-submission format checker
```bash
python .pi/skills/paper-latex-formatting/scripts/latex_checker.py docs/paper/main.tex --venue neurips --check-anon
```

Checks: word count, required sections, TODO markers, anonymization, mismatched environments, content stats.

### Validate citations and references
```bash
python .pi/skills/paper-zotero-hunter/scripts/validate_citations.py \
  --tex docs/paper/main.tex --bib docs/paper/references.bib --check-figures
```

### Clean LaTeX text (fix special characters)
```bash
python .pi/skills/paper-latex-formatting/scripts/clean_latex.py \
  --input docs/paper/main.tex --output docs/paper/main_cleaned.tex
```

Replaces special/non-UTF8 characters with LaTeX equivalents, skips math environments.
Key flags: `--dry-run`, `--tables-only`

### Auto-fix after checking
```bash
python .pi/skills/paper-latex-formatting/scripts/latex_checker.py docs/paper/main.tex --venue neurips --fix
```

Runs checks then applies clean_latex.py fixes, writing to `main_fixed.tex`.

## References

- Venue specs, project structure, packages, commands: `references/venue-templates.md`
- PRA class options, front matter order, citations, floats, length rules: `references/pra-notes.md` (from the official REVTeX 4.2 Author's Guide)
- PRA language and argument moves (abstract/intro wording, voice, hedging, equation/figure sentences): `references/pra-writing-style.md` (distilled from 15 PRA quantum papers 2021–2026 in `tmp-pra-style` + APS style guides)
- PRA figure placement (width planning, float rules, stuck floats): `references/pra-figures.md` (Author's Guide + APS contributor info; mechanics in `paper-figure-layout`)

## Action: `setup`
Create `docs/paper/` and main.tex for the specified venue. Use the template
from `references/venue-templates.md`. For the Chinese twin, ensure both OTFs
and the upstream LICENSE exist in `assets/fonts/noto-serif-cjk/` and compile
from `docs/paper/` with xelatex. Keep these file paths in generated templates.

## Action: `fix`
Fix common LaTeX issues: unescaped special chars, math mode errors, float placement, overfull/underfull boxes, cross-reference issues.

## Action: `check`
Run `latex_checker.py` for pre-submission validation. Check page count,
anonymization, required sections, TODO markers, figure links, and file-based
CJK font paths / LICENSE. If figures were regenerated, also verify actual
plotting fonts and embedded PDF fonts; do not assume a silent fallback matches.

## Related Skills
- Upstream: [paper-writing-section](../paper-writing-section/), [table-generation](../table-generation/)
- Downstream: [paper-compilation](../paper-compilation/)
- See also: [paper-zotero-hunter](../paper-zotero-hunter/)
