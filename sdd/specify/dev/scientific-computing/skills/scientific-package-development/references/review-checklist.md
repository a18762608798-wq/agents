# Julia Package Review Checklist

## Public surface

- The main user operations are obvious without reading internal files.
- Exports/public names are deliberate rather than a dump of helpers.
- Public types/functions have domain meaning and documentation.
- Normal users do not need private fields or internal namespaces.

## Package structure

- `src/PackageName.jl` owns the top-level package module.
- Implementation files are included into that module by default.
- Submodules exist only for real namespace/API boundaries.
- Examples, benchmarks, docs, and experiments do not leak into core dependencies.

## Julia design

- Multiple dispatch represents real semantic variation.
- Abstract types are justified by an extension/interface need.
- Structs model domain data/state/invariants rather than management plumbing.
- Mutating methods use `!` and have clear semantics.
- Type restrictions are no narrower than the supported algorithm requires.

## Compatibility

- Changes to public behavior are identified as additive, compatible, deprecated, or breaking.
- Internal refactors do not accidentally break user-visible behavior.
- Compatibility-sensitive behavior has tests.

## Dependencies

- Mandatory dependencies match the package's core promise.
- Optional ecosystems are isolated when practical.
- Core kernels do not depend on plotting, CLI, repository-relative paths, or experiment files.

## Testing

- `test/runtests.jl` exercises the public API.
- Numerical invariants/reference cases are covered where relevant.
- Supported extension points and important generic numeric behavior are tested.
- Tests do not depend unnecessarily on internal file organization.

## Readability

- A contributor can find the public API, core types, algorithms, and extension points quickly.
- Module nesting is simpler than a module-per-file design.
- Code is split for cohesion/testing/dependency isolation rather than line-count quotas.
