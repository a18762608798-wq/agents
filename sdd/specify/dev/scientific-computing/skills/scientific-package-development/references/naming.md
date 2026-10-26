# Naming for Julia Package APIs

## Principle

Public names should encode stable domain meaning and remain sensible when the implementation changes.

## Types

Prefer domain concepts:

```text
Mesh
Grid
BoundaryCondition
LinearOperator
SolverOptions
Solution
MaterialModel
```

Avoid vague software roles:

```text
DataHandler
ComputationEngine
ResultProcessor
SimulationManager
```

unless those concepts genuinely exist in the domain.

## Functions

Prefer operations users recognize:

```text
solve
assemble!
apply!
interpolate
evaluate
residual
objective
converged
```

Use longer semantic names when the module/package context does not make a short name clear.

Use `!` for mutation.

## Internal helpers

Private helper names may be more implementation-specific but should still be readable. Do not export a helper simply because it has a nice name.

## Mathematical notation

Compact names such as `A`, `b`, `x`, `u`, `dt`, `i`, and `j` are appropriate inside short mathematical kernels. Do not expose opaque single-letter names as broad public API unless the domain convention is exceptionally strong and documented.
