# Julia Guidance for Library Authors

## Functions and dispatch

Prefer functions and multiple dispatch for algorithmic behavior. Define generic functions around domain semantics rather than software roles.

Do not add abstract types unless they provide a meaningful semantic family, shared operation, or downstream extension point.

## Structs

Use structs to represent domain data, validated configuration, state, operators, grids/meshes, and result objects.

Prefer immutable structs by default. Use `mutable struct` when identity-preserving mutation is intentional.

Avoid abstractly typed fields when a concrete parametric design can express the intended variability and performance matters.

## Argument typing

Do not overspecify method signatures. Type annotations should define a real dispatch/interface boundary, not document every argument mechanically.

Prefer capabilities/operations where practical. For numerical containers, accept suitably generic interfaces when the algorithm supports them.

## Mutation

Use `!` for methods that mutate arguments. Make mutation semantics clear in docs and tests.

## Modules

The package must have a top-level module matching the package entry point. Included implementation files normally live in that module.

Submodules are for real namespaces, not file organization.

## Imports

Keep dependency imports explicit. Avoid import hubs whose only purpose is to hide where functionality originates.

When extending a function from another module, use Julia's explicit import/qualification patterns so method ownership is clear.

## Type piracy

Avoid defining methods for a function and type combination that the package owns neither of, unless there is an exceptional, well-justified integration reason. Prefer wrapping, extension packages, or methods involving a type/function the package owns.

## Performance and generic numerics

Library kernels should avoid needless restrictions to `Float64` when generic numeric types are useful. Preserve type stability and generic behavior where the package promises it.

Optimize based on representative benchmarks and profiling rather than speculative complexity.

## Initialization and global state

Keep module initialization small. Avoid mutable global registries unless they are necessary to the package domain and carefully controlled.

Do not use the installed package directory as mutable runtime storage.
