# Python Plotting Boundary

Use Python only downstream of Julia numerical results unless the user explicitly requests otherwise.

## Allowed

- matplotlib figure construction;
- figure styling, labels, annotations, and layout;
- reading Julia-produced result files;
- filtering rows for figures;
- grouping or aggregating already-computed diagnostics;
- reshaping long/wide tables;
- unit conversion needed for presentation;
- computing simple plotting coordinates such as confidence-band polygons from already-computed statistics.

## Not allowed by default

- reimplementing PDE/ODE solvers;
- recomputing optimization objectives that belong to Julia;
- duplicating discretization or simulation logic;
- making Python the source of truth for scientific results just because plotting is convenient there.

## Boundary formats

Choose the simplest adequate format:

- CSV for small/medium tabular outputs;
- Arrow or Parquet for larger tables;
- HDF5 or NetCDF for structured multidimensional scientific data;
- another established domain format when appropriate.

Keep result schemas explicit enough that the plotting script does not need to infer hidden scientific meaning.
