# Research/Application Architecture

## Contents

- Principle
- Small project
- Multi-experiment project
- Files versus modules
- Data flow
- Multiple scientific tasks
- Growth signals
- Anti-patterns

## Principle

A scientific application exists primarily to produce, verify, or reproduce results. Its architecture should make the computation and assumptions easy to inspect.

Do not optimize for an external import API unless another project genuinely needs one.

## Small project

A compact project can be enough:

```text
project/
├── Project.toml
├── Manifest.toml
├── src/
│   ├── model.jl
│   └── solve.jl
├── scripts/
│   └── run.jl
└── python/
    └── plot.py
```

The script owns orchestration; the source files own reusable calculations.

## Multi-experiment project

For several experiments on the same scientific core:

```text
project/
├── Project.toml
├── Manifest.toml
├── src/
│   ├── model.jl
│   ├── discretization.jl
│   ├── solver.jl
│   └── diagnostics.jl
├── experiments/
│   ├── baseline/
│   │   ├── config.toml
│   │   └── run.jl
│   └── grid_convergence/
│       ├── config.toml
│       └── run.jl
├── test/
│   └── runtests.jl
├── python/
│   ├── plot_baseline.py
│   └── plot_convergence.py
├── results/
└── figures/
```

Keep experiment configuration near experiment orchestration, not embedded deep inside the solver.

## Files versus modules

Treat a file split and a namespace split as separate decisions.

Split a file when:

- a contributor would search for concepts separately;
- scientific responsibilities are mixed;
- tests naturally target different definition groups;
- navigation or merge conflicts are becoming painful;
- optional dependencies can be localized.

Create a module only when:

- a namespace boundary has actual value;
- independent loading/testing becomes substantially clearer;
- name isolation is useful at project scope;
- the code is intentionally becoming a reusable package.

A file named `solver.jl` does not imply `module Solver`.

## Data flow

Prefer visible data flow:

```text
configuration/input
  -> build problem/domain state
  -> discretize/assemble
  -> solve/optimize/time-step
  -> diagnostics
  -> persisted numerical results
  -> Python figure scripts
```

A kernel should not need to know where the repository root is or where figures are saved.

## Multiple scientific tasks

When one repository contains distinct tasks, keep them locally coherent.

Example:

```text
src/
├── flow/
│   ├── equations.jl
│   ├── discretization.jl
│   └── solve.jl
└── inverse_problem/
    ├── forward_model.jl
    ├── objective.jl
    └── optimize.jl
```

Directories are allowed to organize ownership without becoming Julia submodules.

Do not create cross-task base classes or shared modules unless there is a stable semantic abstraction with multiple real consumers.

## Growth signals

Refactor when:

- one function performs setup, solving, I/O, and plotting together;
- experiment-specific paths leak into reusable numerical functions;
- global mutable state controls run behavior;
- one source file contains unrelated scientific concepts;
- two tasks are coupled only because a generic framework forced them together;
- a module exists only to mirror a filename;
- reproducing a result requires undocumented manual steps.

Do not split solely because a file crossed an arbitrary line count.

## Anti-patterns

### Package ceremony for a paper calculation

Do not invent exports, semver obligations, and package namespaces for a one-off study unless reuse actually requires them.

### Module-per-file

Avoid `module Model`, `module Solver`, `module Diagnostics` with repeated `using .Model` plumbing when all definitions conceptually belong to one research project.

### Giant run function

Avoid a single function that parses config, loads files, assembles the model, advances the solver, computes diagnostics, writes output, and creates plots.

### Generic framework too early

Avoid `AbstractSolver` or generic `process_data()` layers before stable shared semantics have emerged.
