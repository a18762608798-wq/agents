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

- One serif family per figure set: `Times New Roman, STIXGeneral, DejaVu Serif`.
- Sizes: `font.size=13`, labels 15pt, titles 16pt, ticks 13pt, legend 14pt.
  Rationale: APS requires the smallest letter/number to be >= 2 mm at
  final printed size (single column 8.6 cm), i.e. ~8 pt effective.
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
  Math font is `stix` to match the serif stack.

## 3. Lines, markers, axes

- Curves 1.8pt, axes/ticks 1.0pt. APS floor is 0.5pt; grid off by default.
- Markers: `markersize=6`, `markeredgewidth=0.8` (APS: point diameter >= 1 mm).
- Ticks: outward, `major.size=4.0`, `major.width=1.0`.
  Default auto locators are thinned to at most `max_ticks=5` (4 bins) inside
  `finalize_figure`; explicit locators are preserved.
- Heatmap ticks by printed width:
  - standalone single-column heatmap (≈86 mm): **5 ticks per axis**;
  - one panel of a 2×2 block (≈41 mm each): **3 ticks per axis**, at
    min / mid / max (`0, 0.5, 1`; `-3, 0, 3`), with drawn text 17-18 pt so
    the effective size stays >= 8 pt.
  The **colorbar uses the same count** as the axes (5 or 3) and the same
  size floor; never give the colorbar more ticks than the coordinate axes.
  Reducing tick count is the correct response to a cramped panel; shrinking
  the font is not.
- Colorbar placement (heatmaps): vertical bar on the right, hugging the
  heatmap (`pad=0.005`), shortened at the top (`shrink=0.9`, bottom-anchored
  with `anchor=(1.0, 0.0)`) so the bar bottom aligns with the axes bottom.
  The quantity name goes **horizontally at the top-left of the bar**
  (`cbar.ax.set_title(title, fontsize=22, pad=12, loc="left")`, left edge
  aligned with the bar's left edge). No rotated side label, and the quantity
  name is not repeated as an axes title.
- 2×2 multi-panel heatmaps (composition done in LaTeX): axis labels live
  only on the outer edges — x label on the bottom row, y label on the left
  column; every panel keeps its own ticks and colorbar.
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
- Legend: frameless (`frameon=False`, no box) and always **inside** the axes.
  Choose `loc` so it avoids data; if space is tight, lower the legend font
  size, shorten labels, or split into `ncol=2`. Never place it outside the
  axes bounding box. Never covers data.
- Default image cmap is `viridis`.

## 4. Export

- Vector master `.pdf` or `.svg` for line art; `.png` 300dpi for preview.
- `figure.dpi=100`, `savefig.dpi=300`.
- `bbox_inches="tight"`, white background, not transparent.
- Grayscale sanity: desaturate a copy; series still separable by style/marker.
