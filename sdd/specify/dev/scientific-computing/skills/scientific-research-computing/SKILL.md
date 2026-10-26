---
name: scientific-research-computing
description: Build, modify, review, or refactor Julia research and scientific-computing projects whose primary goal is simulation, numerical analysis, optimization, parameter studies, data analysis, or paper/reproducibility workflows rather than a reusable library API. Use for PDE/ODE solvers, scientific experiments, numerical kernels, convergence studies, research scripts, and computational studies. Default to Julia for numerics and Python only for plotting. Treat files as implementation organization, not namespaces; do not create Julia modules or package ceremony unless the project actually needs an importable reusable package.
---

# Julia Scientific Computing

Optimize for scientific clarity, reproducibility, and numerical correctness. Treat this as application/research code by default, not library design.

## Core rules

1. **Use Julia for numerics.** Put models, discretization, solvers, optimization, statistics, simulation state, diagnostics, and scientific transformations in Julia.
2. **Use Python only for figures.** Python may reshape already-computed outputs for plotting, but must not reimplement the model or solver.
3. **Do not package by reflex.** A paper calculation, parameter sweep, or simulation repository does not need a public package API merely because it has several files.
4. **Files are not modules.** Split `.jl` files for readability without wrapping each file in `module ... end`.
5. **Put computational work in functions.** Avoid long mutable top-level workflows and performance-sensitive global state.
6. **Keep scientific assumptions visible.** Surface units, boundary/initial conditions, tolerances, discretization choices, precision, seeds/RNG handling, and solver options.
7. **Prefer concrete scientific concepts over software frameworks.** Organize around the model, discretization, experiment, objective, diagnostics, or data product rather than `Manager`, `Engine`, or generic base classes.
8. **Validate the science.** Prefer analytical/reference cases, invariants, convergence checks, conservation properties, and reproducibility checks over tests that mirror implementation details.

## Default project shape

Start small and grow only when the computation needs it.

```text
project/
├── Project.toml
├── Manifest.toml              # keep when exact reproduction matters
├── src/
│   ├── model.jl
│   ├── discretization.jl
│   ├── solve.jl
│   └── diagnostics.jl
├── scripts/
│   ├── run_baseline.jl
│   └── run_sweep.jl
├── test/
│   └── runtests.jl            # useful, not ceremonial
├── python/
│   └── plot_results.py
├── data/
├── results/
└── figures/
```

Do not create empty directories just to match the example. A small study may need only `Project.toml`, two Julia source files, one run script, and one plotting script.

Read `references/architecture.md` when choosing or revising the project layout.

## Julia loading and file organization

For ordinary research projects, a run script may include source files directly:

```julia
include(joinpath(@__DIR__, "..", "src", "model.jl"))
include(joinpath(@__DIR__, "..", "src", "solve.jl"))

function main()
    problem = build_problem()
    solution = solve_problem(problem)
    save_results(solution)
    return nothing
end

main()
```

Do not convert `model.jl`, `solve.jl`, and `diagnostics.jl` into `module Model`, `module Solver`, and `module Diagnostics` merely because they are separate files.

A single local project module may be introduced when it clearly improves loading, testing, or name isolation. Even then, keep included implementation files in that module by default; do not create nested submodules per file.

Read `references/julia.md` for Julia-specific guidance.

## Numerical kernel boundary

A numerical kernel should take explicit data/options and return results. It should not unexpectedly:

- parse `ARGS`;
- assume experiment-relative paths;
- call plotting libraries;
- mutate global configuration;
- hide stochastic state that affects results;
- mix persistence with the numerical algorithm unless persistence is explicitly the function's responsibility.

Keep orchestration simple and outward:

```text
script/main()
  -> load configuration and inputs
  -> construct scientific objects
  -> call numerical functions
  -> compute diagnostics
  -> save result data
  -> Python reads result data and plots
```

Do not add a public API facade solely for architectural symmetry.

## Scientific decomposition

Useful file/function boundaries commonly follow:

- mathematical or physical model;
- initial/boundary conditions;
- discretization, grid, mesh, basis, or operators;
- solver or optimizer;
- objective and constraints;
- diagnostics and derived quantities;
- serialization/output;
- experiment orchestration.

Create only boundaries that make the scientific workflow easier to understand or test.

## Reuse and abstraction

Keep code local until reuse is real. Extract a shared helper only when:

1. multiple real consumers exist;
2. the scientific or algorithmic meaning is the same;
3. consumers are expected to change for the same reason;
4. the shared interface is clearer than duplication;
5. the helper can be tested independently.

Do not create `AbstractSolver`, `SharedNumerics`, or a generic processing framework just because two loops have a similar shape.

Use structs for meaningful domain data, parameters, and evolving state. Use multiple dispatch when behavior genuinely differs by domain type or algorithm. Do not create type hierarchies merely to imitate object-oriented frameworks.

## Reproducibility

Make runs reproducible when the scientific claim depends on them:

- use a project-local Julia environment;
- keep `Manifest.toml` when exact dependency reproduction matters;
- record the Julia version for publication-critical results;
- record random seeds or explicit RNG choices for stochastic runs;
- keep configuration and input provenance discoverable;
- save enough metadata with results to reconstruct the run;
- avoid overwriting important results without an intentional policy.

## Performance

Follow Julia's usual performance model:

- put hot work inside functions;
- avoid changing untyped globals in kernels;
- use concrete field types when a struct is performance-sensitive;
- avoid unnecessary allocation in verified hot loops;
- benchmark before adding complex optimization machinery;
- keep the mathematically clearest implementation unless performance evidence justifies complexity.

Do not sacrifice scientific readability for speculative micro-optimization.

## Naming

Use semantic scientific names at project scope and compact notation only inside short mathematical kernels.

Prefer `residual_norm`, `time_step`, `pressure_field`, `stiffness_matrix`, `boundary_values`, and `maximum_iterations` when those meanings matter to a reader. Local `A`, `b`, `u`, `dt`, `i`, or `j` are appropriate when the surrounding mathematics makes them obvious.

Use `!` for functions that mutate an argument according to Julia convention.

Read `references/naming.md` for details.

## Python plotting boundary

Keep Python downstream of Julia results:

- plot from CSV, Arrow, HDF5, NetCDF, Parquet, JLD2-exported tables, or another explicit result format;
- allow lightweight filtering, aggregation, unit conversion, and reshaping needed for a figure;
- do not implement the governing equations, discretization, optimizer, or solver in Python;
- do not make Julia kernels depend on Python plotting.

Read `references/python-plotting.md` when figures are part of the task.

## Review/refactor workflow

When reviewing existing research code:

1. identify scientific responsibilities and run entry points;
2. remove accidental module-per-file structure before inventing new abstractions;
3. move hot/top-level computation into functions;
4. separate plotting and experiment I/O from numerical kernels;
5. make hidden numerical assumptions explicit;
6. preserve numerical outputs while refactoring unless the user authorizes behavior changes;
7. add or preserve analytical/reference/convergence tests;
8. simplify before generalizing.

Do not enforce arbitrary line-count quotas. Split code when mixed concepts, testing difficulty, navigation cost, or dependency tangles make it hard to reason about.

Read `references/review-checklist.md` before considering a substantial implementation or refactor complete.

## Escalation to a package

If the user's real goal becomes an importable, versioned, reusable library for other Julia projects, stop applying research-project defaults and use the `scientific-package-development` skill instead. Do not gradually invent a package API inside a research repository without that intent.
