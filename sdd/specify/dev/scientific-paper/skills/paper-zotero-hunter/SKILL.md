---
name: paper-zotero-hunter
description: Manage paper citations through Zotero. Hunt missing references per claim, verify relevance by actually reading full text via zotero-mcp, file confirmed papers into a paper-topic collection, bind cites into LaTeX plus .bib, then validate and format. Use when draft citations must be backed by papers you have really read.
argument-hint: [tex-or-bib-file]
---

# Paper Zotero Hunter

Full lifecycle of citations, with Zotero as the source of truth.
Replaces free-form Semantic Scholar harvesting: every cited paper must
exist in Zotero AND have been read far enough to confirm it supports
the exact claim at the cite location.

## Input

- `$0` — Action: `harvest`, `verify`, `bind`, `validate`, `format`
- `$1` — Path to `.tex` or `.bib` file
- `$2` — (optional) Target collection path. Omitted = hunter default.

## Preconditions

- zotero-mcp reachable (Zotero desktop running). On `Connection refused`,
  stop and ask the user to start Zotero; do not proceed blind.
- The `zotero-paper-hunter` skill is installed; hunting itself follows
  its procedure (dedup by DOI then normalized title, `if_exists='file'`,
  tags `agent-crawled, unreviewed` only — never invent other tags).

## Collections rule

- Default (no `$2`): hunter convention — topic `paper/inbox`
  (e.g. `quant_comp/paper/inbox`); missing chain is created as
  `physics/<topic>/paper/inbox` and reported.
- Paper project: create ONE root-level collection named after the paper
  topic (e.g. `paper-TVC-gravity`) and pass it as `$2`. Papers confirmed
  relevant in `verify` are additionally filed there, so the cited set
  for this paper lives in one place. The inbox copy stays (dual filing,
  same spirit as hunter's inbox + topical archiving).
- Never scatter entries across ad-hoc collections; one run = the
  resolved target collection(s) only.

## Scripts (local)

### Validate citations (check all cite keys resolve)

```bash
python .opencode/skills/paper-zotero-hunter/scripts/validate_citations.py \
  --tex docs/paper/main.tex --bib docs/paper/references.bib --check-figures --figures-dir docs/paper/figures/
```

Reports: missing citations, unused bib entries, duplicate keys, duplicate
sections, duplicate labels, undefined references, missing figures.

### Auto-fix missing citation placeholders

```bash
python .opencode/skills/paper-zotero-hunter/scripts/validate_citations.py \
  --tex docs/paper/main.tex --bib docs/paper/references.bib --fix
```

Generates `references_fixed.bib` with placeholder entries for all missing
citation keys. Placeholders must be replaced by `bind` output before submission.

### Harvest fallback (Zotero unreachable only)

```bash
python .opencode/skills/paper-zotero-hunter/scripts/harvest_citations.py \
  --tex docs/paper/main.tex --bib docs/paper/references.bib --output candidates.bib --max-rounds 10 --dry-run
```

Candidate BibTeX only — still requires `verify`+Zotero filing before citing.

## Action: `harvest` — find what's missing, hunt via Zotero

1. Scan the draft for claims needing citations (especially Introduction /
   Related Work gaps and method comparisons).
2. For each gap, run the `zotero-paper-hunter` flow: check library first
   (semantic + exact search, dedup), then web discovery, fetch full text,
   file into the target collection with `agent-crawled, unreviewed` tags.
3. Output: per-gap candidate list with Zotero keys. Do NOT write `\cite`
   yet — citing happens only in `bind` after verification.

## Action: `verify` — read, then confirm relevance to the cite spot

For each hunted candidate, in order:

1. Open the full text via zotero-mcp (attachment path → read PDF).
   Entry without retrievable full text is marked `条目-only`, cited only
   if the claim is metadata-level (existence/year/authors), never for
   technical content.
2. Read the sections relevant to the specific claim at the planned cite
   location (method, theorem, result, number — not just the abstract).
3. Verdict per candidate: `确认相关` (quote the supporting passage +
   cite location) or `不相关` (one-line reason, never cited).
4. Record verdicts in the citation report (below). Relevance evidence
   lives in the report, NOT in new Zotero tags (tag set is fixed).

## Action: `bind` — write cites + .bib from verified papers only

For each `确认相关` verdict:

1. Pull metadata from the Zotero item, hand-write the BibTeX entry,
   checking every field against the source.
2. Key format: `firstAuthorLastNameYearFirstContentWord`
   (e.g. `vaswani2017attention`). Skip if the key already exists.
3. Append to `.bib`, insert `\cite{key}` at the exact confirmed location.
4. Sort `.bib` alphabetically by key when done.

## Action: `validate` — pre-compilation check

Run `validate_citations.py` (above). Fix everything it reports before
compiling. No placeholders survive to submission.

## Action: `format` — standardize .bib

- Sort entries alphabetically by key
- Consistent 2-space indentation, no empty fields
- Protect proper nouns with `{Braces}` in titles
- Required fields present per entry type

## Citation report (per run, fixed template)

```text
## 引用报告:<draft路径>
- 目标collection:<路径>(key)
- 已确认:N篇
  1. 标题 — 作者,年份 — Zotero key — 支持位置(章节/行) — 支撑句摘录
- 不相关(未引):N篇(给一句话原因)
- 条目-only:N篇(仅用于元数据级论述)
- 失败:N篇(给原因:无全文/下不到/标题对不上)
```

## Prohibitions (inherited)

- No citing a paper you have not verified against the cite location.
- No PDF attached under a mismatched entry (verify title page first).
- `if_exists` is always `file`; never `duplicate`.
- No non-academic content as references.
- Tag set is fixed (`agent-crawled, unreviewed`); no invented tags.

## Related Skills

- Upstream: [paper-writing-section](../paper-writing-section/) (Related Work mode; gaps come from Related Work), [zotero-paper-hunter] (hunting procedure)
- Downstream: [paper-latex-formatting](../paper-latex-formatting/) (compile by agent directly: latexmk, no skill)
- See also: [paper-assembly](../paper-assembly/)
