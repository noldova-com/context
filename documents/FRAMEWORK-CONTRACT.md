# CONTEXT framework contract

**Scope:** Framework references, package composition, global exposure, compiler and language-server consumption, replacement, and source navigation

`LIBRARY-TOPOLOGY.md` owns library identity and responsibility; `PACKAGE-CONTRACT.md` owns reference resolution and the package graph.

## 1. Identity and references

A **framework** is one named, exactly identified composition of library packages and exposure rules.
A **framework reference** is distinct from a project reference and a package reference.

An ordinary project receives the SDK's exact default framework reference when its manifest omits `frameworks`.
When present, `frameworks` is the complete declared list: an empty list selects no framework, and a non-empty list selects exactly those frameworks.
Retaining the default beside another framework requires listing both.
The effective references are materialized in the resolved compilation input even when the default was implicit.

The default framework's identity is deliberately undecided.
`noldova.context` is reserved for the `ctx` command host and is not a framework identity.

## 2. Composition

A framework identifies its exact package closure and compatibility identity; the packages exposed as legal source-import roots; the public symbols exposed globally without a source import; the member augmentations activated for those symbols; required package initialization and its deterministic dependency order; and dependencies on other accepted frameworks.

Framework packages remain ordinary packages with ordinary `.ctxl` artifacts, independent compilation units, declared dependencies, tests, and ownership.
A framework does not create a solution-wide compilation, bypass package-cycle rules, expose package source, or introduce another library format.

Source-import permissions follow `PACKAGE-CONTRACT.md`.

A project that produces a package in a framework composition declares its `frameworks` list explicitly.
Core declares an empty list; another framework package lists only frameworks it intentionally consumes, so no package acquires a dependency on the framework it produces.

## 3. Global and importable APIs

A framework-provided global requires no TypeScript `import`; the compiler binds it from the framework's validated package metadata.
Global projection preserves call and construction behavior, static and instance members, prototype-observable behavior, and activated augmentations.
The Runtime projects the owning library's concrete class as the single global value under `ARCHITECTURE.md`.

During the stage-zero Node bootstrap, existing ECMAScript globals remain host-provided rather than framework-resolved.

A non-global API follows normal source-import rules from its owning exposed package: framework inclusion removes the need for a separate package reference, not the import.
Selecting a framework activates its declared augmentations and required package initialization without source imports.
Initialization follows the validated package dependency graph and completes before affected user code executes; missing, cyclic, ambiguous, or failed initialization prevents publication or execution and never leaves the language server and Runtime with different surfaces.

TypeScript's built-in library declarations are ambient globals.
Importable framework APIs, when adopted, are CONTEXT APIs rather than copied TypeScript built-ins.

## 4. Compiler and language server

The source compiler consumes the exact framework package closure as validated `.ctxl` inputs, which contain every public semantic fact required for binding, typing, diagnostics, lowering, linking, and execution.
The language server uses the same compiler-owned semantic model and `.ctxl` metadata for completion, hover, semantic colorization, references, and navigation; it maintains no second hard-coded framework catalog.
Optional `.ctxd` information and installed SDK sources may enrich documentation and navigation; their absence cannot change compilation or execution.
Go-to-source resolves a symbol's ordinary package and source identity.

## 5. Selection and replacement

Framework resolution is exact and fail-closed.
Missing, ambiguous, duplicate, incompatible, cyclic, or contradictory compositions fail before semantic analysis.
There is no silent version roll-forward, nearest-framework selection, host-based substitution, or fallback to compiler-bundled declarations.

Replacing a framework changes a declared semantic input and therefore the resolved package closure and artifact identity.
A replacement must provide every capability its project claims; a same-named symbol is not proof of compatibility.

## 6. Runtime and SDK boundary

The SDK supplies installed framework metadata, authoring sources, and exact resolution.
The Runtime loads the executable `.ctxl` closure a portable program requires.
A library does not become an SDK component because the SDK carries its authoring inputs, and Runtime execution never reads vendored TypeScript declaration files.
