# Julia Guidance for Research Computing

## Functions first

Put computational work in functions. Top-level scripts should mainly configure and orchestrate runs.

Prefer explicit arguments and return values over changing global variables. If a global constant is genuinely fixed, declare it intentionally; changing run parameters should normally be passed through configuration or data structures.

## Structs

Use structs for domain concepts, parameters, grids/meshes, boundary conditions, solver options, and meaningful evolving state.

Prefer immutable structs by default. Use `mutable struct` when identity-preserving state mutation is part of the scientific model or algorithm.

Avoid generic controller types such as `SimulationManager` when a few functions plus domain structs express the workflow more clearly.

## Multiple dispatch

Use multiple dispatch when behavior genuinely varies by meaningful domain or algorithm type.

Good reasons include:

- different boundary-condition types;
- different discretization schemes sharing a stable operation;
- different material/physics models with the same scientific operation;
- different solver strategies with an established common function.

Do not introduce `abstract type AbstractSolver end` merely because two solver loops both iterate.

## Files and modules

A Julia file is not a namespace. `include("x.jl")` evaluates definitions in the including module/scope.

For a research application, source files may be included from the run script or from one optional local project module. Do not wrap every file or directory in a module.

If one local module is useful:

```julia
module StudyCore

include("model.jl")
include("solve.jl")
include("diagnostics.jl")

end
```

The included files normally contain definitions directly, without nested modules.

## Mutation

Use Julia's `!` suffix for functions that mutate one or more arguments, for example `advance_step!` or `assemble!`.

Prefer mutation when it is natural and materially useful for performance or state evolution; do not make everything mutable by default.

## Type annotations

Do not overspecify argument types. Generic numerical functions often benefit from accepting `AbstractVector`, `AbstractMatrix`, or unconstrained arguments when the required operations define the interface.

Use concrete field types in performance-sensitive structs. Avoid abstractly typed struct fields when the concrete type is known and performance matters.

## Performance

- keep hot code inside functions;
- avoid changing untyped globals in performance-critical paths;
- benchmark representative workloads before complex optimization;
- inspect allocations when they matter;
- preallocate or mutate where evidence shows a benefit;
- keep numerical types generic when useful (`Float32`, `Float64`, `BigFloat`, dual numbers, etc.) unless the method truly requires one type.

## Randomness

Make stochastic behavior explicit. Prefer passing an RNG to functions when reproducibility or parallel execution matters.

Example:

```julia
function sample_initial_state(rng, model, n)
    # ...
end
```

Do not hide publication-critical randomness behind implicit global RNG usage if exact reproduction is expected.

## Error handling and assertions

Use clear validation near public/run boundaries for invalid parameters and inconsistent dimensions. Avoid expensive assertions inside verified hot loops unless they are necessary for correctness.

## I/O

Keep file paths and serialization in orchestration or explicit I/O functions. Numerical kernels should work with arrays/structs/options rather than repository-relative paths.
