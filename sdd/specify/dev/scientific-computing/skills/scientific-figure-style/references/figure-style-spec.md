# Figure Style Spec (style-only, no journal layout)

Source of truth for palette, fonts, lines, axes, export.
No column widths, no captions, no REVTeX. Size is caller-controlled.

## 1. Palette: data semantics first

- **Qualitative (unordered categories):** default 5-color Okabe-Ito subset
  `#0072B2` `#D55E00` `#009E73` `#CC79A7` `#000000`.
  Source: Wong, Nature Methods 8, 441 (2011). These five meet 3:1 on white.
- **Full Okabe-Ito (8):** add `#E69F00` `#56B4E9` `#F0E442` when needed.
  Yellow `#F0E442` is weak on white; use for fills, not thin lines.
- **Many categories (up to 9):** Paul Tol muted
  `#CC6677 #332288 #DDCC77 #117733 #88CCEE #882255 #44AA99 #999933 #AA4499`.
  Source: SRON/EPS/TN/09-002 issue 3.2. Do not interpolate qualitative palettes.
- **Sequential:** `viridis` / `plasma` / `cividis`. **Diverging with a real center:**
  `coolwarm` / `RdBu_r` with explicit norm. Never `jet` / `rainbow` / `turbo`.
- Palette alone is not accessibility. Every series gets color **plus**
  linestyle or marker. Red-vs-green as sole contrast is forbidden.

## 2. Fonts and text

- One serif family per figure set: `Times New Roman, STIXGeneral, DejaVu Serif`
  (serif stack compatible with the paper). Times New Roman is the formal
  plotting target. User-supplied local fonts live in `assets/fonts/times-new-roman/`
  as `times.ttf`, `timesbd.ttf`, `timesi.ttf`, `timesbi.ttf`; the helper registers
  these four faces per process and prefers them over same-name system fonts.
  No OS installation is required. Discovery is helper-relative; `font_dir=...`
  is an optional explicit override. Incomplete local assets or wrong families
  must fail rather than silently change font. With no local directory, generic
  projects retain the legacy system fallback.
  Before formal export call the helper, then verify every face's resolved path
  with `fallback_to_default=False`; disclose preview-only fallback.
- Project paths follow `docs/README.md`: figures in `figs/<feature>/`,
  CJK paper fonts plus LICENSE in `assets/fonts/noto-serif-cjk/`, local plotting
  fonts with original licensing notes in `assets/fonts/times-new-roman/`.
  The scientific-computing preset includes all four TTFs and their original
  licensing notes; install them with `scripts/install-fonts.sh <project-root>`.
  The independent paper skill bundle supplies CJK OTFs and LICENSE. CJK paper fonts
  do not replace plotting serif/math fonts.
- Drawn sizes (`font.size=13`, labels 15pt, titles 16pt, ticks 13pt,
  legend 14pt) are **placeholders only**. The final printed text is uniform:
  after all drawing call `uniform_text(fig, font_pt_for(fig, printed_width_pt))`
  (`PRINT_COL_PT` = single column, `PRINT_TEXT_PT` = full width,
  `CAPTION_PT = 9.0`) so every text object prints at caption size 9 pt.
  Never hand-tune individual `fontsize=` for the final size.
- Panel identifiers `(a)`, `(b)` … are `ax.text` in axes-fraction coordinates
  **inside** the frame corner (default upper-left `(0.035, 0.93)`,
  `va="top"`, `ha="left"`), colored for contrast against the panel
  background; `uniform_text` normalizes their size.
- Effective size shrinks with the canvas:
  `effective_pt = drawn_pt × target_width_mm / drawn_width_mm`.
  At the 86 mm single column a 163 mm canvas scales by 0.53 (13 pt ticks →
  6.9 pt, too small) while a 107 mm canvas scales by 0.80 (13 pt → 10.4 pt).
  Draw single-column figures at ~107 mm; keep the 163 mm default for
  full-width figures only. `effective_min_text_pt(fig, target_width_mm)`
  returns the smallest rendered text size and is the check to run before
  export.
- `pdf.fonttype=42`, `ps.fonttype=42`, `svg.fonttype=none`
  (editable text; appearance depends on installed fonts).
- Numbers: `0.2` not `.2`, decimal point on baseline, same decimals per axis.
- `axes.unicode_minus=False` so minus signs render correctly.
- Mathtext (built-in, no system LaTeX): wrap math in `$...$` with a raw
  string, e.g. `r"$a_1$"`, `r"$\alpha > \beta$"`. Bare `a_1` renders
  literally and is forbidden. Units stay outside math:
  `r"$a_1$ (ms)"`. `text.usetex` stays `False`; full LaTeX is out of scope.
  Math font is `stix` to match the serif stack and actual helper settings.

## 3. Lines, markers, axes

- Curves 1.8pt, axes/ticks 1.0pt. APS floor is 0.5pt; grid off by default.
- Markers: `markersize=6`, `markeredgewidth=0.8` (APS: point diameter >= 1 mm).
- Ticks: outward, `major.size=4.0`, `major.width=1.0`.
  Default auto locators are thinned to at most `max_ticks=5` (4 bins) inside
  `finalize_figure`; explicit locators are preserved.
- Heatmap ticks by printed width:
  - standalone single-column heatmap (≈86 mm): **5 ticks per axis**;
  - one panel of a 2×2 block (≈41 mm each): **3 ticks per axis**, at
    min / mid / max (`0, 0.5, 1`; `-3, 0, 3`).
  The **colorbar uses the same count** as the axes (5 or 3) and the same
  size floor; never give the colorbar more ticks than the coordinate axes.
  Reducing tick count is the correct response to a cramped panel; shrinking
  the font is not (`uniform_text` keeps the printed size at 9 pt regardless).
- Heatmaps: cell-edge convention. A heatmap value is a bin, not a point:
  compute edges with `cell_edges(centers, lo=..., hi=...)` (interior edges at
  midpoints, outer edges pinned to the plotted range), draw with
  `pcolormesh(edges_x, edges_y, C, shading="flat")`, and set the axis limits
  to that same range. Endpoint ticks then sit on the frame corners and no
  half-cell is clipped. Mixing `shading="nearest"`/`"auto"` with endpoint
  ticks is the defect this rule exists to prevent.
- Spines: all four on (closed box), 1.0pt. No half-open frames.
- OO API: `fig, ax = plt.subplots()`. One Axes = one panel.
- Axis labels carry units in parentheses: `t (ms)`, `R (10^3 Ω)`.
- Legend: frameless (`frameon=False`, no box), default **inside** the axes at a
  `loc` that avoids data. When every inside spot covers data (multi-panel
  shared series), use one shared figure-level legend **below the axes in a
  single row** (`fig.legend(..., loc="lower center", ncol=<n series>)`) and
  reserve bottom margin with `fig.subplots_adjust(bottom=...)`. Figure-level
  legends are normalized by `uniform_text` like everything else.
- Default image cmap is `viridis`.

## 4. Export

- Vector master `.pdf` or `.svg` for line art; `.png` 300dpi for preview.
- `figure.dpi=100`, `savefig.dpi=300`.
- `bbox_inches="tight"`, white background, not transparent.
- Grayscale sanity: desaturate a copy; series still separable by style/marker.
