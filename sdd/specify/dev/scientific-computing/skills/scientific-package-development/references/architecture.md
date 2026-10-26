# Julia Package Architecture

## Contents

- Standard shape
- Main module
- Files versus submodules
- Dependency direction
- Extensions and optional dependencies
- Examples and experiments
- Growth signals
- Anti-patterns

## Standard shape

```text
MyPackage.jl/
├── Project.toml
├── src/
│   ├── MyPackage.jl
│   ├── types.jl
│   ├── model.jl
│   ├── operators.jl
│   └── solve.jl
├── test/
│   └── runtests.jl
├── ext/
├── docs/
├── examples/
└── benchmark/
```

Only create optional directories when the package needs them.

## Main module

The main source file owns the package namespace:

```julia
module MyPackage

using LinearAlgebra

export Problem, Solution, solve

include("types.jl")
include("model.jl")
include("solve.jl")

end
```

Keep this file focused on package composition: imports, public declarations, includes, and small initialization logic.

## Files versus submodules

Implementation files normally share the package namespace.

Prefer:

```text
src/MyPackage.jl
src/types.jl
src/operators.jl
src/solve.jl
```

with plain included definitions.

Create a submodule when a qualified namespace is a deliberate user/developer concept, not because a file exists.

Good submodule signals:

- independently meaningful API;
- substantial independently extensible subsystem;
- unavoidable structural name conflicts;
- package extension integration;
- separate loading/ownership semantics that materially improve design.

Bad submodule signals:

- one submodule per file;
- one submodule per generic software layer;
- splitting only to satisfy a size quota;
- translating Python package directories mechanically into Julia modules.

## Dependency direction

A simple package flow is:

```text
downstream caller
  -> public generic functions/types
  -> package implementation
  -> mandatory dependencies
```

Optional integrations should attach at the edge rather than forcing their dependency stacks into the core.

Do not let core numerical code depend on:

- CLI parsing;
- experiment-relative filesystem layout;
- plotting code;
- examples or benchmarks;
- mutable global registries unless the package domain truly requires them.

## Extensions and optional dependencies

Use package extensions when optional functionality should activate only when another package is present.

Keep extension code localized and avoid duplicating the package's core algorithm there. The extension should normally provide integration methods/adapters for an optional ecosystem.

## Examples and experiments

Examples demonstrate API usage. They should consume the public API as a user would.

Research workflows, parameter sweeps, paper figures, and large experiment-specific configurations should not dictate the package's core API. Keep them under a separate experiment/application environment when they have their own lifecycle.

## Growth signals

Refactor when:

- users need internal modules or fields to perform common tasks;
- exports have grown into an accidental dump of helpers;
- optional integrations inflate startup/dependency cost for all users;
- a type hierarchy exists but dispatch does not use it meaningfully;
- module nesting mostly mirrors source filenames;
- public and private behavior are hard to distinguish;
- compatibility-sensitive behavior lacks tests.

Do not refactor solely because a file crossed an arbitrary line count.

## Anti-patterns

### Module-per-file

Avoid a tree of `Types`, `Model`, `Solver`, `Diagnostics` submodules with repeated imports and re-exports when all concepts belong to one package API.

### Export everything

Do not make every helper public for convenience. Keep the supported user surface deliberate.

### Manager architecture

Avoid a giant mutable object that owns I/O, configuration, numerical state, solver execution, plotting, and persistence.

### Experiment paths in a library

A package should not assume a repository-relative run directory, writable installation directory, or paper-specific output location.
