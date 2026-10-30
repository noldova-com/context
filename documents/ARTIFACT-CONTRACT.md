# CONTEXT artifact contract

**Scope:** Public file kinds, portable executable and library artifacts, optional developer information, target-native outputs, portability, and artifact identity

## 1. Terms

- A **portable primary artifact** is an executable or library whose representation is independent of the compilation host, target operating system, target architecture, checkout path, and output path.
- A **portable developer artifact** is optional information associated with one portable primary artifact.
  Its absence cannot change program behavior.
- A **target-native artifact** is an AOT-compiled product for one exact operating system, architecture, executable format, and ABI.
- **Build state** is compiler-owned cache, fingerprint, temporary, staging, or incremental information.
  It is not a distributable artifact kind.

`RUNTIME-AND-SDK.md` owns the products that produce and consume these artifacts.

## 2. Public extension namespace

| Extension | Kind | Role |
|---|---|---|
| `.ctxs` | Solution manifest | Authoring input under `PACKAGE-CONTRACT.md` |
| `.ctxp` | Project manifest | Authoring input under `PACKAGE-CONTRACT.md` |
| `.ctx` | Portable executable | Runtime-loadable entry product |
| `.ctxl` | Portable library | Importable package code and required metadata |
| `.ctxd` | Portable developer information | Optional debug, symbol, source, documentation, and tooling data for one `.ctx` or `.ctxl` |

Extensions are exact and lowercase; a public CONTEXT file has one kind and one extension, with no aliases or alternate spellings.
No additional public `.ctx*` extension exists without changing this contract: `.ctxm` is not a metadata artifact (developer metadata belongs in `.ctxd`), `.ctxfp` is not a public artifact (fingerprints belong to compiler-owned storage), `.ctxmap` is not a public artifact (native address maps belong to native debug data), and `.ctxf` has no meaning.
These names receive no compatibility aliases before the first public release.

## 3. Portable primary artifacts

A `.ctx` is a portable executable with one validated entry contract.
The Runtime loads it as the root of a portable execution and resolves its declared `.ctxl` closure.
It is not accepted as a library dependency and cannot be loaded through the library boundary.

A `.ctxl` is a portable library containing importable package code and every semantic fact required to consume the package correctly.
Only a validated library artifact satisfies a package-library dependency, and a library cannot substitute for an executable.
`COMPILER-ARCHITECTURE.md` owns dependency artifact isolation; the same `.ctxl` is the input for Runtime loading and AOT dependency-closure validation.

The filename extension and the internal kind discriminator must agree; consumers validate both and reject a mismatch before loading code or metadata.
Renaming never changes semantic kind.
Development versions follow `VERSIONING-AND-COMPATIBILITY.md`; the magic bytes, field and section encoding, and complete binary schema require their own binary-format contract.

## 4. Required facts stay in the primary artifact

Every fact required to validate, resolve, load, link, execute, or preserve the observable semantics of a portable program belongs in `.ctx` or `.ctxl`: artifact kind and format compatibility; package and dependency identity; imports, exports, entry information, and linkage; public member augmentations and required package initialization; type, member, generic, layout, dispatch, and value facts required at a package or runtime boundary; public semantic attributes including required deprecation status; runtime-visible metadata required by accepted reflection or dynamic behavior; and integrity information.
A consumer never opens `.ctxd` to recover a required fact: deleting every `.ctxd` from an otherwise complete installation changes no resolution, validation, execution result, or supported behavior.
Whether a category is required is determined by observable language, package, and runtime contracts, not by whether it is commonly called debug, symbol, reflection, or documentation information.

## 5. Optional developer artifact

A `.ctxd` is an optional portable sidecar for one exact `.ctx` or `.ctxl`.
It may contain independently sectioned information: a canonical source registry and source-content identities; portable-code offsets mapped to source lines and columns; human-readable names not required by execution; debugger scope and variable-location information; documentation comments and IDE information; and future optional sections accepted by the version-1 schema.
New developer categories extend the sectioned schema; they never create new extensions.

Each `.ctxd` identifies its exact primary artifact through a cryptographic content identity defined by the binary schema; a consumer rejects a sidecar whose identity, kind, or format does not match.
Stored source paths are project-relative with `/` separators and never contain an absolute checkout, SDK, temporary, installation, or output path.
A `.ctxd` contains no native instruction addresses or address maps, no PE, ELF, or Mach-O structure, no target ABI, relocation, loader, or native dependency information, no fact required to execute or preserve semantics, and no build state.
A debugger or inspection operation that explicitly selects a malformed or mismatched `.ctxd` fails clearly rather than guessing, substituting another sidecar, or reporting incorrect data.

## 6. Portable identity

Portable compilation follows compile once, consume many:

```text
project and solution inputs
  -> one portable compilation
     -> .ctx or .ctxl
     -> optional .ctxd
  -> zero or more target-native AOT translations
```

For the same declared source, manifests, dependency artifacts, exact effective framework closure and exposure rules, compiler identity, selected source profile, and other semantic inputs, `.ctx`, `.ctxl`, and `.ctxd` are byte-identical regardless of the compilation host (Windows, Linux, or another supported host); the host filesystem's path syntax, enumeration order, case behavior, or timestamps; the absolute checkout, package-cache, SDK, temporary, or output location; the target requested for later AOT work; process identity, machine identity, locale, time zone, or wall-clock time; and whether another native output is requested in the same build.
Portable emission therefore excludes target triples, native filenames, loader paths, operating-system library names, target addresses, timestamps, random identifiers, and environment-derived ordering; encodings, tables, sections, strings, and dependency records use explicit canonical forms and deterministic ordering defined by their schemas.

`COMPILER-ARCHITECTURE.md` owns the source-compiler and AOT input boundary.
Portable artifacts reference logical package identities, never a Windows DLL, Linux shared object, native interpreter, native path, or another target detail; a conforming target Runtime supplies the portable runtime contract beneath those identities.
An executable whose complete closure uses the accepted portable contract runs without recompilation on every conforming Runtime.

## 7. Target-native artifacts

A target-native artifact is produced for one exact operating system, architecture, executable format, and ABI.
Its filename, suffix, layout, debug format, loader information, and dependency representation follow the applicable target contracts, for example Windows `.exe`, `.dll`, and `.pdb`; Linux extensionless executables, `.so` libraries, and ELF/DWARF debug data; and macOS executables, `.dylib` libraries, and `.dSYM` bundles.
The examples define no supported target: a target becomes supported only through its own accepted format, ABI, dependency-closure, Runtime, and verification contracts.

Native debug data owns native instruction-to-source mapping.
It may use the portable mapping from `.ctxd` as an input but never appends to or mutates the portable `.ctxd`.
Different targets produce different native bytes; for the same exact target and declared inputs, native output is still deterministic.
The target Runtime is itself a target-native product under `RUNTIME-AND-SDK.md`.

## 8. Build state

Compiler caches, dependency fingerprints, temporary files, incremental records, staging receipts, and similar build state live only beneath declared generated storage; are never installed or distributed as `.ctx*` artifacts; are never required to validate or execute a complete product; may be deleted to force a correct clean rebuild; and do not become public because a build places them beside an artifact.
This authorizes no exclusion of generated output from verification under `BUILD-AND-VERIFICATION.md`.

## 9. Validation

Artifact consumers fail explicitly when a filename extension and internal kind disagree; an executable is supplied as a library or a library as an executable; version or compatibility validation fails under `VERSIONING-AND-COMPATIBILITY.md`; required metadata or a declared dependency is missing or incompatible; duplicate or contradictory identity is present; an explicitly selected `.ctxd` does not match its primary artifact; or target-native output disagrees with its target contract.
Consumers never recover by renaming an artifact, probing alternate extensions, loading source, consulting build state, selecting a same-named neighbor, or using `.ctxd` as a semantic fallback.
