---
name: scientific-package-development
description: Design, implement, review, refactor, or prepare reusable Julia packages and library APIs intended to be loaded by other Julia projects with using/import, versioned as stable internal libraries, or distributed/registered as packages. Use for Julia package structure, public API design, exports/public symbols, multiple-dispatch interfaces, package tests/docs, extensions, compatibility, and library refactors. Default to one top-level package module with implementation split across included files in the same namespace; do not create a submodule per file. Do not use this skill for one-off simulations or paper/research applications unless they are intentionally being promoted into a reusable library.
---

# Julia Package Development

Build a Julia library for downstream users. Optimize for a small coherent public API, idiomatic dispatch, maintainability, and compatibility rather than experiment orchestration.

## Core rules

1. **Use the conventional package shape.** Define one top-level package module in `src/PackageName.jl`.
2. **Files are not modules.** Split implementation into included `.jl` files inside the package module; do not wrap every file in a submodule.
3. **Design the public API deliberately.** Public names should represent stable scientific/domain concepts and operations, not implementation plumbing.
4. **Use functions and multiple dispatch idiomatically.** Introduce abstract types only when they represent a real extensible semantic interface.
5. **Keep implementation replaceable.** Downstream users should not need internal files, private struct fields, or internal namespaces to perform normal operations.
6. **Treat documented public behavior as a compatibility contract.** Avoid exporting helpers before they are ready to support.
7. **Keep dependencies and optional integrations controlled.** Do not force heavy optional ecosystems on all users when an extension boundary is more appropriate.
8. **Test user-visible behavior.** Test the public operations, invariants, numerical properties, and supported extension points.

## Default package shape

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
├── ext/                        # optional package extensions
├── docs/                       # optional
├── examples/                   # optional
└── benchmark/                  # optional
```

`src/MyPackage.jl` should usually remain small:

```julia
module MyPackage

export Problem, Solution, solve, assemble!

include("types.jl")
include("model.jl")
include("operators.jl")
include("solve.jl")

end
```

The included files normally contain definitions directly in `MyPackage`; they do not need `module Types`, `module Model`, or `module Solver` wrappers.

Read `references/architecture.md` for package structure and namespace guidance.

## Public API design

Start from what downstream users need to accomplish, not from the internal file tree.

Prefer APIs built from:

- domain types with clear invariants;
- a small set of meaningful generic functions;
- constructors that establish valid states;
- mutation-marked operations such as `assemble!` when mutation is part of the contract;
- result types or ordinary Julia values that are easy to inspect and compose.

Avoid exposing:

- helper functions solely because another source file uses them;
- internal storage fields as the only supported access path;
- file names/submodules as part of the user mental model;
- generic `Manager`, `Engine`, `Processor`, or `Handler` abstractions with no domain meaning.

A source file boundary is not an API boundary.

Read `references/api-design.md` for detailed interface rules.

## Modules and namespaces

Create a submodule only when it adds a real namespace/API boundary, for example:

- users intentionally work with a qualified namespace;
- a subsystem is independently extensible and semantically separable;
- name collisions are structural and qualification improves clarity;
- Julia's package-extension mechanism calls for an extension module.

Do not create submodules solely because:

- a file or directory exists;
- implementation code is long;
- types/functions fall into different source files;
- you want to imitate Python packages or Java namespaces.

When refactoring module-per-file code, flatten definitions into the package module when possible and preserve compatibility wrappers only where downstream breakage would otherwise be unacceptable.

## Julia interface style

- Prefer functions and multiple dispatch over controller classes.
- Use structs for domain data, state, configuration, and invariants.
- Prefer immutable structs unless identity-preserving mutation is meaningful.
- Do not overspecify argument types when generic operations define the contract.
- Use abstract types only for real semantic families with useful shared operations or extension points.
- Use `!` for functions that mutate arguments.
- Keep generic functions broad enough to compose, but do not create abstraction before concrete use cases justify it.

Read `references/julia.md` for idiomatic library guidance.

## Compatibility and encapsulation

Treat public behavior as a contract. Before changing a public name, signature, return convention, or documented semantic:

1. identify downstream callers;
2. decide whether the change is additive, compatible, deprecated, or breaking;
3. preserve behavior where practical;
4. provide a migration/deprecation path when the compatibility cost is justified;
5. update tests and documentation together.

Do not promise stability for private implementation details. Keep private helpers unexported and undocumented as public API.

Prefer accessor functions or stable operations over requiring callers to depend directly on internal fields when field layout may change.

## Dependencies and extensions

Keep the core dependency surface proportional to the package's core purpose.

For optional integrations:

- prefer weak/optional dependency mechanisms and package extensions when appropriate;
- keep extension-specific imports and methods outside the core package loading path;
- avoid making plotting, file formats, GPU ecosystems, or other optional stacks mandatory unless they are central to the package promise.

Do not make Python a runtime dependency merely for plotting. Package examples may write result data that external Python scripts visualize, but Julia library functionality should stand on its own unless cross-language integration is explicitly part of the product.

## Testing

Use `test/runtests.jl` as the package test entry point.

Test:

- public constructors and core operations;
- documented error conditions;
- numerical invariants/reference cases;
- type-generic behavior where promised;
- mutation semantics for `!` functions;
- extension points or optional integrations when supported;
- regressions for previously fixed bugs;
- compatibility-sensitive behavior.

Avoid tests that merely encode internal file organization or private helper call sequences.

## Documentation and examples

Document public types and functions. Examples should show the intended user path through the API rather than internal modules or private helpers.

Keep examples runnable and close to real use. Do not turn experimental paper workflows into the core API; place them under examples or separate research projects when appropriate.

## Naming

Public names should be domain-specific and durable under implementation refactors.

Prefer names such as `Mesh`, `BoundaryCondition`, `assemble!`, `solve`, `residual`, `interpolate`, or `objective` when those concepts match the domain.

Avoid names that expose plumbing such as `DataHandler`, `ComputationEngine`, `process_data`, or `run_pipeline` unless the domain genuinely uses those concepts.

Read `references/naming.md`.

## Review/refactor workflow

When reviewing an existing Julia package:

1. identify the current public surface and likely compatibility obligations;
2. distinguish public API from accidental exports/internal namespaces;
3. flatten module-per-file structure when it adds no real namespace value;
4. simplify type hierarchies and manager objects that do not represent domain semantics;
5. keep numerical kernels independent of CLI, repository-relative paths, and plotting;
6. minimize mandatory dependencies and isolate optional integrations;
7. preserve public behavior while changing internals unless breaking changes are authorized;
8. test from the downstream user's perspective.

Do not enforce arbitrary file/function line-count limits. Split implementation when cohesion, navigation, testing, or dependency isolation improves.

Read `references/review-checklist.md` before considering a package change complete.

## Keep research applications outside the core

If a repository contains both a stable package and active experiments, keep the experiment lifecycle outside the package core, for example in `experiments/`, `examples/`, or a separate project environment.

If the user's real task is a paper computation, parameter sweep, or one-off scientific study rather than an importable library, use the `scientific-research-computing` skill instead.
