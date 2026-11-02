"""Generic scientific matplotlib style helper.

Style-only: palette + fonts + lines + export. No journal layout,
no column widths, no captions.

Sources:
- Okabe-Ito colors via Wong, Nature Methods 8, 441 (2011)
- Paul Tol qualitative schemes, SRON/EPS/TN/09-002 issue 3.2
- k-dense scientific-visualization publication.mplstyle (general print start)

Usage:
    from figure_style import apply_figure_style, finalize_figure, DEFAULT_PALETTE
    apply_figure_style()
    fig, ax = plt.subplots()
    ax.set_xlabel(r"$a_1$ (ms)")  # mathtext with raw string; never "a_1"
    ...
    finalize_figure(fig, "fig1.pdf")
"""

from pathlib import Path

import matplotlib as mpl
import matplotlib.pyplot as plt
from matplotlib import font_manager
import numpy as np

# Five Okabe-Ito colors meeting 3:1 against white (k-dense subset).
# Still pair each with linestyle/marker; palette alone is not accessibility.
DEFAULT_PALETTE = [
    "#0072B2",  # blue
    "#D55E00",  # vermillion
    "#009E73",  # bluish green
    "#CC79A7",  # reddish purple
    "#000000",  # black
]

# Full Okabe-Ito (Wong 2011), in plot order. Yellow/orange need care on white.
FULL_OKABE_ITO = [
    "#E69F00",
    "#56B4E9",
    "#009E73",
    "#F0E442",
    "#0072B2",
    "#D55E00",
    "#CC79A7",
    "#000000",
]

# Paul Tol muted (9 max) as second choice for many categories.
TOL_MUTED = [
    "#CC6677", "#332288", "#DDCC77", "#117733", "#88CCEE",
    "#882255", "#44AA99", "#999933", "#AA4499",
]

LINESTYLES = ["-", "--", "-.", ":"]
MARKERS = ["o", "s", "^", "D", "v", "x", "+"]


def cell_edges(centers, lo=None, hi=None):
    """Bin edges for a cell-edge heatmap (`pcolormesh(shading="flat")`).

    Rule: a heatmap value is a bin, not a point. Interior edges sit midway
    between neighbouring centres; the two outer edges extend half a step and
    can be pinned to the plotted range with ``lo``/``hi``. Ticks then land on
    cell boundaries, so endpoint ticks sit exactly on the frame corners.

    Never mix centre-based shading (`shading="nearest"`) with endpoint ticks:
    the outer half-cells get clipped and the tick no longer marks a boundary.
    """
    c = np.asarray(centers, dtype=float)
    if c.ndim != 1 or c.size < 2:
        raise ValueError("centers must be a 1-D array with at least two points")
    edges = np.empty(c.size + 1)
    edges[1:-1] = 0.5 * (c[:-1] + c[1:])
    edges[0] = c[0] - 0.5 * (c[1] - c[0])
    edges[-1] = c[-1] + 0.5 * (c[-1] - c[-2])
    if lo is not None:
        edges[0] = lo
    if hi is not None:
        edges[-1] = hi
    return edges


def register_project_fonts(font_dir=None):
    """Register all four local Times New Roman faces, ahead of system copies.

    By default, look for assets/fonts/times-new-roman/ above this helper,
    so vendored copies work independently of the current working directory.
    A project without local fonts retains the existing system-font fallback;
    an explicit or partially populated directory must contain every face.
    Registration is process-local and must run in each plotting process.
    """
    if font_dir is None:
        for parent in Path(__file__).resolve().parents:
            candidate = parent / "assets" / "fonts" / "times-new-roman"
            if candidate.is_dir():
                font_dir = candidate
                break
        else:
            return ()

    font_dir = Path(font_dir).expanduser().resolve()
    paths = tuple(font_dir / name for name in (
        "times.ttf", "timesbd.ttf", "timesi.ttf", "timesbi.ttf",
    ))
    missing = [str(path) for path in paths if not path.is_file()]
    if missing:
        raise FileNotFoundError("Missing Times New Roman font files: " + ", ".join(missing))
    for path in paths:
        family = font_manager.FontProperties(fname=str(path)).get_name()
        if family != "Times New Roman":
            raise ValueError(f"Expected Times New Roman, found {family!r}: {path}")

    # Avoid a same-name system font winning a tie against the supplied files.
    # addfont clears Matplotlib's lookup cache; repeated calls stay idempotent.
    font_manager.fontManager.ttflist[:] = [
        entry for entry in font_manager.fontManager.ttflist
        if entry.name != "Times New Roman"
    ]
    for path in paths:
        font_manager.fontManager.addfont(str(path))
    return paths


def apply_figure_style(palette=None, *, font_dir=None):
    """Set style and register local fonts. Call before creating figures."""
    register_project_fonts(font_dir)
    colors = palette or DEFAULT_PALETTE
    mpl.rcParams.update(
        {
            "figure.dpi": 100,
            "savefig.dpi": 300,
            "savefig.bbox": "standard",
            "savefig.facecolor": "white",
            "savefig.transparent": False,
            # Editable embedded text; Type 3 avoided.
            "pdf.fonttype": 42,
            "ps.fonttype": 42,
            "svg.fonttype": "none",
            "font.family": "serif",
            "font.serif": ["Times New Roman", "STIXGeneral", "DejaVu Serif"],
            "font.size": 13,
            "axes.labelsize": 15,
            "axes.titlesize": 16,
            "xtick.labelsize": 13,
            "ytick.labelsize": 13,
            "legend.fontsize": 14,
            "legend.frameon": False,
            "legend.loc": "best",
            # Built-in mathtext only; no system LaTeX dependency.
            # Caller must still wrap math in $...$ with a raw string.
            "text.usetex": False,
            "mathtext.fontset": "stix",
            "mathtext.default": "regular",
            "axes.linewidth": 1.0,
            "xtick.major.width": 1.0,
            "ytick.major.width": 1.0,
            "xtick.major.size": 4.0,
            "ytick.major.size": 4.0,
            "xtick.minor.width": 0.8,
            "ytick.minor.width": 0.8,
            "lines.linewidth": 1.8,
            "lines.markersize": 6,
            "lines.markeredgewidth": 0.8,
            "axes.grid": False,
            "axes.spines.top": True,
            "axes.spines.right": True,
            "axes.prop_cycle": mpl.cycler(color=colors),
            "image.cmap": "viridis",
            "axes.unicode_minus": False,
        }
    )
    return colors


def style_axes(ax, xlabel=None, ylabel=None):
    """Minimal axis conventions: units in parens, outward ticks.

    Pass mathtext labels directly, e.g. style_axes(ax, r"$a_1$ (ms)").
    """
    if xlabel:
        ax.set_xlabel(xlabel)
    if ylabel:
        ax.set_ylabel(ylabel)
    ax.tick_params(direction="out")
    return ax


def effective_min_text_pt(fig, target_width_mm):
    """Smallest text size after the drawn canvas is scaled to `target_width_mm`.

    Journals specify text size at the *final printed* width, so a figure drawn
    on a wide canvas and shrunk in LaTeX loses points linearly:
    ``effective_pt = drawn_pt * target_width_mm / drawn_width_mm``. Use this to
    check the floor (8 pt; project target is caption size 9 pt) before export
    (86 mm = APS single column). Covers every text artist: ticks, labels,
    titles, in-axes texts (panel tags, annotations), colorbar labels,
    figure texts and figure-level legends.
    """
    scale = float(target_width_mm) / (fig.get_figwidth() * 25.4)
    sizes = []
    for ax in fig.axes:
        if ax.xaxis.label.get_text():
            sizes.append(ax.xaxis.label.get_fontsize())
        if ax.yaxis.label.get_text():
            sizes.append(ax.yaxis.label.get_fontsize())
        sizes.extend(t.label1.get_fontsize() for t in ax.xaxis.get_major_ticks())
        sizes.extend(t.label1.get_fontsize() for t in ax.yaxis.get_major_ticks())
        if ax.get_title():
            sizes.append(ax.title.get_fontsize())
        # Titles placed with loc="left"/"right" live in separate artists.
        for attr in ("_left_title", "_right_title"):
            title = getattr(ax, attr, None)
            if title is not None and title.get_text():
                sizes.append(title.get_fontsize())
        legend = ax.get_legend()
        if legend is not None:
            sizes.extend(text.get_fontsize() for text in legend.get_texts())
        sizes.extend(text.get_fontsize() for text in ax.texts)
    sizes.extend(text.get_fontsize() for text in fig.texts)
    for legend in fig.legends:
        sizes.extend(text.get_fontsize() for text in legend.get_texts())
    return min(sizes) * scale if sizes else None


# Printed widths of the REVTeX two-column layout (measured from the built PDF):
# single column 245 pt, full text width 508 pt. Journal captions are 9 pt.
PRINT_COL_PT = 245.0
PRINT_TEXT_PT = 508.0
CAPTION_PT = 9.0


def font_pt_for(fig, printed_width_pt, target_pt=CAPTION_PT):
    """Drawn font size that prints at `target_pt` on a `printed_width_pt` canvas."""
    drawn_pt = fig.get_figwidth() * 72.0
    return target_pt * drawn_pt / float(printed_width_pt)


def uniform_text(fig, fontsize):
    """Force every text object in `fig` to one font size (ticks, labels,
    titles, colorbar ticks/titles, legends, annotations, figure legends).

    Call after all drawing and before export when the figure is shrunk into
    the paper: set ``fontsize = font_pt_for(fig, printed_width_pt)`` so that
    the printed text matches the caption size.
    """
    for ax in fig.axes:
        ax.tick_params(axis="both", which="both", labelsize=fontsize)
        ax.xaxis.label.set_fontsize(fontsize)
        ax.yaxis.label.set_fontsize(fontsize)
        ax.xaxis.get_offset_text().set_fontsize(fontsize)
        ax.yaxis.get_offset_text().set_fontsize(fontsize)
        if ax.get_title():
            ax.title.set_fontsize(fontsize)
        # Titles placed with loc="left"/"right" live in separate artists.
        for attr in ("_left_title", "_right_title"):
            title = getattr(ax, attr, None)
            if title is not None and title.get_text():
                title.set_fontsize(fontsize)
        legend = ax.get_legend()
        if legend is not None:
            for text in legend.get_texts():
                text.set_fontsize(fontsize)
        for text in ax.texts:
            text.set_fontsize(fontsize)
    for text in fig.texts:
        text.set_fontsize(fontsize)
    for legend in fig.legends:
        for text in legend.get_texts():
            text.set_fontsize(fontsize)
    return fontsize


def finalize_figure(fig, path, dpi=300, max_ticks=5):
    """Save with embedded fonts. PDF/SVG for vector, PNG as preview.

    Default auto tick locators are thinned to at most `max_ticks` major
    ticks per axis (`MaxNLocator(nbins=max_ticks-1)`); explicitly set
    locators (e.g. fixed pi ticks) are kept.
    """
    from matplotlib.ticker import AutoLocator, MaxNLocator

    nbins = max(1, max_ticks - 1)
    for ax in fig.axes:
        for axis in (ax.xaxis, ax.yaxis):
            if isinstance(axis.get_major_locator(), AutoLocator):
                axis.set_major_locator(MaxNLocator(nbins=nbins, prune=None))
    fig.savefig(path, dpi=dpi, bbox_inches="tight", facecolor="white",
                transparent=False)
    return path


if __name__ == "__main__":  # smoke test
    import numpy as np

    apply_figure_style()
    x = np.linspace(0, 10, 200)
    fig, ax = plt.subplots()
    ax.plot(x, np.sin(x), label=r"$a_1$", linestyle="-", marker="None")
    ax.plot(x, np.cos(x), label=r"$a_2$", linestyle="--", marker="None")
    style_axes(ax, r"$t$ (ms)", "signal (arb. units)")
    ax.legend(frameon=False)
    finalize_figure(fig, "/tmp/figure_style_smoke.pdf")
    finalize_figure(fig, "/tmp/figure_style_smoke.png")
    print("wrote /tmp/figure_style_smoke.pdf and /tmp/figure_style_smoke.png")
