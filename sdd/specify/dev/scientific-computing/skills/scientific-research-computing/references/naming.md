# Naming for Scientific Julia Code

## Principle

Encode meaning at the scope where a human reader needs it.

## Project-level names

Prefer semantic names such as:

```text
residual_norm
iteration_count
time_step
stiffness_matrix
boundary_values
initial_temperature
objective_gradient
sample_weights
pressure_field
```

Avoid generic placeholders such as `tmp`, `data1`, `thing`, `obj`, `foo`, `bar`, or `process_data` in broad scopes.

## Mathematical kernels

Compact notation is appropriate when code directly mirrors mathematics and the scope is short.

Reasonable local names include:

- `x`, `y`, `z` for coordinates/vectors;
- `t`, `dt`, `dx`;
- `i`, `j`, `k` for indices;
- `n`, `m` for local counts/dimensions;
- `A`, `b` for a visibly local linear system;
- `u`, `v`, `p` for conventional field variables.

Do not let compact symbols leak into large orchestration scopes where their meaning is no longer obvious.

## Functions

Name functions after scientific or algorithmic operations:

```text
assemble_stiffness_matrix
compute_residual
advance_time_step!
solve_pressure_field
evaluate_objective
load_boundary_conditions
save_convergence_table
```

Use `!` when a function mutates an argument.

Avoid vague verbs such as `process`, `handle`, `execute`, or `update` unless the surrounding domain gives them a precise established meaning.

## Types

Name types after domain concepts:

```text
Mesh
BoundaryConditions
SolverOptions
SimulationState
MaterialProperties
ConvergenceHistory
```

Avoid vague software roles such as `SimulationManager`, `DataHandler`, or `ComputationEngine` unless the concept genuinely exists in the domain.

## Units and conventions

Encode units or frames when ambiguity is plausible, or represent them with a strong units/type system.

Examples:

```text
time_seconds
velocity_body_frame
position_world_frame
```
