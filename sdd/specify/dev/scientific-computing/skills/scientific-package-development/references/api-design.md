# Julia Package API Design

## Start from user operations

List the stable operations downstream users need before deciding exports or type hierarchies.

A good API often centers on a small number of generic functions:

```julia
problem = Problem(...)
solution = solve(problem; options...)
value = evaluate(solution, query)
assemble!(buffer, operator, state)
```

The exact names should follow the domain.

## Exports and public surface

Export names that users are expected to call frequently and that the package is prepared to support.

Do not export implementation helpers merely to shorten internal qualified names.

A symbol can remain accessible through qualification without becoming part of the recommended user path. Keep documented/public behavior deliberate.

## Constructors and invariants

Constructors should establish valid domain objects. Validate materially invalid configurations near construction or API boundaries rather than allowing errors to surface deep inside numerical kernels.

Avoid constructors that perform surprising expensive simulations or hidden file I/O unless that behavior is central and clearly documented.

## Accessors versus fields

If users need a concept and the internal representation may change, prefer a stable operation/accessor over requiring direct field access.

Direct field access is fine when the field layout is intentionally part of the supported data model and the package is willing to maintain it.

## Generic functions and dispatch

Use a shared generic function when different types implement the same semantic operation.

Good:

```julia
apply!(y, op::FiniteDifferenceOperator, x)
apply!(y, op::SpectralOperator, x)
```

Questionable:

```julia
abstract type AbstractSolver end
```

when the concrete solvers share no stable operation beyond having loops.

## Keyword arguments and options types

Use keyword arguments for small optional behavior that is easy to understand independently.

Use an options struct when:

- many options travel together;
- validation/invariants matter;
- the options are reused across calls;
- the configuration itself is a meaningful domain concept.

Avoid huge unstructured keyword bags that become an accidental configuration language.

## Results

Return ordinary Julia values or a meaningful result type. Do not force users to parse internal logs or mutable manager state to obtain outputs.

Expose diagnostics that are scientifically meaningful and stable enough to support.

## Errors

Document important error conditions at public boundaries. Prefer errors that explain which user-level invariant was violated.

## Compatibility

Before changing a public API, decide whether the change can be additive or whether a deprecation bridge is appropriate. Avoid accidental breaking changes caused solely by internal refactors.
