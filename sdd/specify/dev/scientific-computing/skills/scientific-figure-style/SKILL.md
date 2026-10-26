---
name: scientific-figure-style
description: Apply consistent matplotlib figure style (palette, fonts, lines, export) without journal layout. Use when the user mentions 画图风格, 配色, 字体, 线宽, colorblind-safe, Okabe-Ito, Tol palette, viridis, or asks to make, revise, or check a scientific figure's visual style — style-only, no column widths, no captions, no REVTeX.
---

# Scientific Figure Style

Style-only guardrail for matplotlib figures: same palette, fonts, and line discipline on every figure. No paper layout.

Why this exists: hand-tuned rcParams drift across figures. A shared helper plus a fixed palette keeps color meaning stable and print-readable. Palette alone is never a compliance claim; always pair color with linestyle/marker.

## Workflow

### 1. Apply style before plotting

```python
from figure_style import apply_figure_style, finalize_figure, DEFAULT_PALETTE
apply_figure_style()
```

Use `scripts/figure_style.py`. It sets a colorblind-safe cycle, embeddable font types, and sane line weights. Do not hand-tune rcParams from scratch; call the helper, then only adjust what the task needs. Figure size is caller-controlled; this skill does not set widths.

Read `references/figure-style-spec.md` for palette sources and limits.

### 2. Build the figure OO-style

- Use `fig, ax = plt.subplots()`; never rely on bare `plt.plot` state for multi-panel work.
- Color + shape redundancy: never encode meaning by color alone. Combine `DEFAULT_PALETTE` order with distinct linestyles/markers so the grayscale version stays readable.
- Forbidden: `jet`/`rainbow`/`turbo` colormaps, red-vs-green as the only contrast, lettering placed over shaded data, legend covering data.
- Axes labels carry units in parentheses: `t (ms)`, `R (10^3 Ω)`. Write `0.2`, not `.2`. Prefer integer ticks; keep equal decimals on one axis.
- Math labels use built-in mathtext: raw string + `$...$`, e.g. `ax.set_xlabel(r"$a_1$ (ms)")`. Bare `a_1` is forbidden. Full LaTeX (`text.usetex`) is out of scope.
- Sequential data: `viridis`/`plasma`/`cividis`. Diverging with a real center: `coolwarm`/`RdBu_r` with explicit norm.

### 2b. Print legibility floor (APS)

At the **final printed size** (single column 8.5 cm), the figure must still pass:

| Item | Floor | Where it lives |
|---|---|---|
| smallest letter/number | 2 mm cap height (≈8 pt effective) | `axes.labelsize=15`, `axes.titlesize=16`, ticks 13, legend 14 |
| data-point diameter | 1 mm | `lines.markersize=6` |
| curve linewidth | 0.18 mm (0.5 pt) | `lines.linewidth=1.8` |

- Draw bigger than the slot and let LaTeX scale down; never draw at 1:1 and shrink fonts.
- **Effective size is what counts:** `effective_pt = drawn_pt × target_width_mm / drawn_width_mm`. At the 86 mm APS single column, a default 163 mm canvas shrinks by 0.53 (13 pt ticks → 6.9 pt: too small) and a 107 mm canvas by 0.80 (13 pt → 10.4 pt). Reserve the 163 mm canvas for full-width figures; draw single-column figures at ~107 mm. `effective_min_text_pt(fig, target_width_mm)` returns the smallest rendered text size for this check.
- Ticks stay sparse: `finalize_figure` thins default auto locators to at most `max_ticks=5` (5 ticks = 4 bins); explicit locators (π ticks, rank labels) are left alone.
- Heatmap tick count follows the printed panel width: **5 ticks per axis for a standalone single-column heatmap** (≈86 mm), **3 ticks per axis when it is one of a 2×2 block** (≈41 mm each). The **colorbar follows the same count** as the axes (5 or 3, at min / mid / max). For 3-tick panels use `0, 0.5, 1` / `-3, 0, 3` and raise the drawn font to 17-18 pt. Fewer ticks is the fix for a small panel, never smaller text.
- Closed box: all four spines on at 1.0 pt; no half-open frames.
- Heatmaps are **cell-edge** bins: build edges with `cell_edges(centers, lo=..., hi=...)`, draw with `pcolormesh(..., shading="flat")`, and set the axis limits to the plotted range so endpoint ticks land on the frame corners. Never mix centre-based shading (`shading="auto"/"nearest"`) with endpoint ticks: the outer half-cells get clipped and the tick stops marking a boundary.
- Heatmap colorbar: **vertical bar on the right, hugging the heatmap** (`pad=0.005`), shortened at the top (`shrink=0.9`, bottom-anchored); quantity name **horizontal at the top-left of the bar** (`loc="left"`), left edge aligned with the bar. In a 2×2 block, axis labels go on the outer edges only (x: bottom row, y: left column); ticks and colorbars stay on every panel.
- Legends stay **inside the axes** (`frameon=False`, no box). Large is relative: keep the legend legible but reduce its font size, shorten labels, or use `ncol=2` before ever moving it outside the axes. A legend outside the axes is a defect, not a fix for overlap.

### 3. Export vector master

```python
finalize_figure(fig, "fig1.pdf")   # vector master
finalize_figure(fig, "fig1.png")   # 300dpi preview
```

- Vector PDF/SVG for line art; PNG 300dpi only as preview.
- `bbox_inches="tight"`, `facecolor="white"`, `transparent=False`.
- Grayscale sanity: desaturate a copy; series still separable by style/marker.

## Report structure

Always close with this compact block:

```markdown
## figure style check
- palette: DEFAULT 5-color Okabe-Ito subset / actual: ...
- fonts: serif Times New Roman/STIXGeneral/DejaVu Serif, embedded Type 42: yes/no; labels 15 / title 16 / ticks 13 / legend 14
- legibility: effective smallest text >= 8pt at final size: yes/no
- lines: curves 1.8pt, axes 1.0pt, markers 6pt
- box: four spines on: yes/no; ticks per axis <= 5: yes/no
- redundancy: color + linestyle/marker: yes/no
- export: figN.pdf (vector) + figN.png (300dpi)
- remaining risk: ...
```

## Examples

**Example 1:**
Input: 对比两条失谐曲线，统一一下风格
Output: `apply_figure_style()` + 两色+两线型 + `finalize_figure(fig,"fig1.pdf")` + 上面report block

**Example 2:**
Input: 把这个jet图改成色盲友好的
Output: 换DEFAULT_PALETTE+viridis，线宽提至1.0–1.5pt，附grayscale可读说明
