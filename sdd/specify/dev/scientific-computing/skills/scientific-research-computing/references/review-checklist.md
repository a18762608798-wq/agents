# Research Computing Review Checklist

## Scientific intent

- The main scientific questions/tasks are obvious from the tree and entry scripts.
- Parameters, units, boundary/initial conditions, tolerances, and solver choices are discoverable.
- Stochastic runs have controlled RNG/seed behavior when reproducibility matters.

## Julia structure

- Numerical work is inside functions rather than long performance-sensitive top-level code.
- File boundaries follow useful scientific concepts.
- Files are not wrapped in modules merely because they exist.
- No generic framework or abstract hierarchy exists without a stable semantic need.
- Domain structs represent meaningful data/state rather than software management roles.

## Data flow

- Numerical kernels receive explicit data/options and return results.
- CLI parsing, file paths, persistence, and plotting are outside core kernels.
- Python does not reimplement the numerical model or solver.

## Reproducibility

- The Julia project environment is explicit.
- A manifest/version/provenance strategy matches the reproducibility needs.
- Result files contain enough metadata to identify the run.

## Numerical validation

- Important invariants or analytical/reference cases are tested when available.
- Convergence and tolerance behavior are checked where relevant.
- Precision and normalization assumptions are intentional.

## Readability

- Names are semantic outside compact mathematical kernels.
- A new contributor can find model, discretization, solver/optimizer, diagnostics, and run entry points quickly.
- Code is split for comprehension/testing rather than arbitrary line-count quotas.
