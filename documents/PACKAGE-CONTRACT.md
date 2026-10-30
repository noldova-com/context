# CONTEXT package contract

**Scope:** Package identity, project and solution manifests, dependencies, discovery, resolution, and internal access

## 1. Terms

- A **package** is one canonical named unit of distribution and dependency ownership.
- A **project** is one named compilation unit defined by source and one project manifest (`.ctxp`).
- A **package project** produces one library or executable package.
- A **test project** is a non-distributable library project that verifies installed packages.
  Test is a workflow role, not a project kind: filenames and Testing-owned decorators identify its tests under `TESTING-CONTRACT.md`, and it is never packed, installed, published, or included in production artifacts.
- A **solution** (`.ctxs`) is an explicit graph of project-manifest references.
- A **framework reference** selects one exact framework composition under `FRAMEWORK-CONTRACT.md`.

The project manifest owns the project's declared identity, development version, kind, project and package dependencies, framework references, and internal-access grants.
A package project's identity is its package identity.
A path locates that authority; it does not replace it.

## 2. Canonical identity

Every project has one fully qualified declared name of the form `noldova.context.<name>`, except the `ctx` command-host package whose reserved identity is exactly `noldova.context`.
A name is lowercase ASCII letters and digits in dot-separated segments; a name with an uppercase letter is invalid, so no two identities differ only in case on any file system.
`<name>` may contain further segments, such as `noldova.context.parsers.typescript`, when the responsibility is genuinely nested within a broader domain; nesting expresses ownership, not directory convenience.
The npm package of `noldova.context.<name>` is `@noldova/context.<name>`.

Each package root contains separate production and test project directories.
The package root, production `.ctxp` basename, and declared identity match exactly; the test manifest carries its own identity:

```text
noldova.context.collections/
  src/
    noldova.context.collections.ctxp
  tests/
    noldova.context.collections.tests.ctxp
```

The command host follows the same rule (`noldova.context/src/noldova.context.ctxp`).
Matching makes placement predictable; it never lets a consumer infer identity without reading and validating the manifest, and a name, directory, basename, or import with different casing is not an alias.
Repository category directories such as `src/parsers/` group package roots by responsibility and carry no semantic identity.

Every project declares its development version and consumers validate exact artifact and compatibility identities under `VERSIONING-AND-COMPATIBILITY.md`.

## 3. Discovery

An explicit manifest path is canonical for its operation; every downstream consumer carries the exact resolved reference and never searches for, reconstructs, or rediscovers it.
Directory-based discovery is a convenience at the command boundary only, using a deterministic sorted scan under a zero/one/many rule: zero eligible manifests fail and require an explicit path; one is selected; more than one fails.
Filesystem order never selects an owner, no basename such as `context.ctxp` receives privileged fallback, and upward solution discovery, if supported, selects only the nearest directory containing exactly one eligible solution manifest.

## 4. References

A solution references exact `.ctxp` paths relative to itself; each reference is validated against the referenced project's declared identity and cannot rename it.
A path-valued project dependency names an exact `.ctxp` relative to the referencing manifest.
The referenced manifest supplies the dependency's identity, kind, and dependencies.
An installed-package dependency resolves through the declared installation mechanism to exactly one package of the requested identity; source directories, nearby filenames, and same-name search results are not candidates.

The manifest's `frameworks` field is a flat list.
`FRAMEWORK-CONTRACT.md` owns its default selection, exact composition, exposure, and SDK resolution.

The manifest's parent directory is the complete source root; there is no configurable source path.
A package project's manifest and sources live in the package root's `src/`; its test project's manifest and mirrored tests live in the sibling `tests/`.

## 5. Dependency graph

The dependency graph is derived from project manifests and their effective framework compositions, never duplicated in a root script, configuration array, or hand-maintained order list.
The temporary Node bootstrap is the sole exception: its explicit ordered configuration builds npm forms before the SDK build provider exists and is not a semantic graph, resolver, or certification input.
Package-local `package.json` files are temporary bootstrap manifests containing only `name`, `version`, `type`, `main`, `types`, and `license`, plus `dependencies` for packages actually imported during the bootstrap.
Other npm metadata requires a demonstrated bootstrap requirement.
These manifests are removed with the bootstrap.

Resolution produces one deterministic graph with exact identities.
The graph owner validates every reference before compilation; rejects missing, duplicate, ambiguous, case-mismatched, wrong-kind, and cyclic dependencies; computes a stable topological order independent of filesystem or map iteration order; and provides that order to build, test, generation, and packaging workflows.
Only library package projects may be package dependencies; executables cannot be consumed as libraries.

## 6. Compilation-unit boundary and internal access

`COMPILER-ARCHITECTURE.md` owns separate compilation units and dependency artifact isolation; `BUILD-AND-VERIFICATION.md` owns build, pack, install, and test order.
Only declared direct dependencies and packages explicitly exposed by an effective framework are legal source-import roots; the transitive `.ctxl` closure supplies their contracts without authorizing additional direct imports, and only symbols and augmentations the framework exposes enter the source surface.
These rules apply equally to production and test projects.

A project may grant named consumers access to its package-internal types, members, and extensions through `internalsVisibleTo` in its own `.ctxp`:

```json
"internalsVisibleTo": [
  "noldova.context.parsers.regex.tests"
]
```

Entries are exact, case-sensitive project identities, not paths or patterns; an omitted or empty list grants nothing.
Only the owning project grants access; a grant exposes no private members, makes nothing public, is not transitive, is not a dependency, and adds no build-order edge.
The capability applies to ordinary projects, not only tests.
During the Node bootstrap the field records permission only, and `TESTING-CONTRACT.md` owns the test-local declaration mechanism; the future compiler and artifact metadata enforce grants against the consumer's resolved identity without widening the public API.

## 7. Identity versus physical representation

Semantic package, export, and dependency identity derives from validated manifest declarations, never from absolute checkout paths, object identity, filesystem order, or source-array insertion order.
Relocating an identical checkout changes no identity, public name, or code-bearing output; absolute paths may appear only in explicitly non-authoritative presentation or debug data.
`ARTIFACT-CONTRACT.md` owns artifact kinds and portability; the frozen project's CTXN and CTXL formats are not adopted.

## 8. Failure policy

Package resolution fails before semantic analysis or emission when required identity is missing, contradictory, ambiguous, incompatible, or malformed.
It never recovers by guessing a manifest basename or sibling directory, matching an unqualified or case-folded name, choosing the first filesystem or collection entry, loading a dependency's source tree, inspecting emitted code to reconstruct declarations, substituting an executable for a library, falling back from an invalid framework to the default, or treating every package in a framework's closure as an import root.
Diagnostics identify the referencing manifest, requested identity, attempted reference, and exact reason, under `DIAGNOSTIC-CONTRACT.md`.
