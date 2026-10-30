# CONTEXT Runtime and SDK

**Scope:** Runtime and SDK product ownership, dependency direction, target composition, installation, and the debugging boundary

## 1. Product split

CONTEXT has two distinct products.
The **CONTEXT Runtime** is the target-native production host that validates, resolves, loads, and executes portable CONTEXT applications and libraries.
The **CONTEXT SDK** is the development product that builds, tests, inspects, packages, debugs, and AOT-compiles the ecosystem; its core tools are portable CONTEXT applications and libraries executed by an exact compatible target-native Runtime.

The products have separate identities, manifests, dependency closures, and installation boundaries.
A Runtime-only installation is supported.
The SDK may install or distribute its exact compatible Runtime as a separately identified component without merging the products.
The Runtime never depends on the SDK, and an application with a complete portable closure never requires the SDK to execute.
The SDK is a product composition, not one executable and not one required code representation; a host composition may add the Runtime, authoring inputs, target contracts, and genuinely host-specific adapters or toolchains without making the portable SDK core target-specific.

## 2. Runtime ownership

The Runtime validates and loads one executable `.ctx`; resolves and loads its declared transitive `.ctxl` closure through the package-resolution boundary; validates artifact kind, format, compatibility, identity, and required metadata before executing affected code; executes required package initialization in validated dependency order before affected user code; provides the execution engine and runtime mechanisms required by supported TypeScript and ECMAScript behavior; preserves accepted value, package- boundary, exception, lifetime, and concurrency semantics; and owns the target-native boundary through which portable operations reach the selected operating system or kernel contract.

The Runtime does not own source compilation or type checking, manifest authoring, package building or publishing, AOT compilation or native linking, test, coverage, conformance, or certification orchestration, debugger clients or IDE tooling, general inspection tools, or any SDK discovery or fallback mechanism.
Removing the SDK from a machine with a complete Runtime installation changes nothing about the execution of an accepted portable application.

The Runtime distribution owns the public `ctx` command host, whose reserved identity `noldova.context` is not a framework identity.
The host obtains commands from exact declared providers: Runtime providers are available in a Runtime-only installation, and installing the SDK adds development providers without replacing the host or creating a Runtime dependency on the SDK.
Provider discovery is deterministic and identity-based; it never selects the first loadable file, scans arbitrary native libraries, or depends on an SDK fallback.
Implementing the command host and its providers requires a separate design decision.

## 3. SDK ownership

The SDK owns, as separately owned components: TypeScript parsing, binding, checking, and diagnostics; manifest processing; deterministic `.ctx`, `.ctxl`, and `.ctxd` emission; target selection, AOT compilation, native linking, and native debug production; package build, pack, install, and publication tooling; command providers for accepted development workflows; test, coverage, conformance, generation, and certification tooling; debugger, disassembler, metadata, symbol, and inspection tooling; and the authoring declarations and reference material supported workflows require.
The SDK label is not permission to create a monolithic package or an ownerless tooling directory.

SDK tools are authored in TypeScript and, once self-hosting is available, are produced primarily as portable artifacts that the installed compatible Runtime executes.
The SDK does not duplicate Runtime behavior inside an SDK-only execution host.
An SDK tool may additionally be AOT-compiled for measured performance or a distribution requirement; that native form derives from the tool's portable artifact, is not an alternate semantic authority, and must behave and produce artifacts equivalently under the applicable verification.
The AOT input boundary in `COMPILER-ARCHITECTURE.md` applies equally to portable and native SDK-tool forms.

## 4. Dependency direction

```text
portable application
  -> portable library closure
  -> portable Runtime contract
  -> target-native Runtime
  -> accepted target kernel or operating-system boundary

SDK
  -> portable compiler and development-tool package closure
  -> exact compatible target-native Runtime
  -> optional AOT-derived SDK-tool forms
  -> optional genuine host adapters
  -> optional target AOT toolchains
```

Forbidden reverse dependencies: Runtime to SDK; portable application or library to SDK; Runtime execution to source trees, authoring manifests, compiler caches, or development installations; and portable artifacts to target-native filenames, loader paths, or operating-system libraries.
Runtime and SDK composition introduces no filename or directory probing as a substitute for declared identity.

## 5. Targets and native closure

Each Runtime build targets one exact operating system, architecture, executable format, and native ABI; different targets may contain different native implementations behind the same accepted portable Runtime contract.
The portable SDK core is host- and target-independent and byte-identical across development hosts for the same inputs; an installed composition selects a host only for its Runtime and accepted host-native components, may contain AOT backends for additional targets, and may cross-compile without changing the portable tools or the portable application artifacts those backends consume.
A target-native AOT application is not hosted by the portable Runtime unless it explicitly embeds or invokes portable execution.

Every Runtime target has one explicit, inspectable native dependency closure that contains no SDK or development-tool dependency, no undeclared or search-path-selected dependency, and no third-party user-space library unless a future target contract explicitly changes this rule; it uses the smallest accepted target boundary and fails verification when an unexpected dependency appears.
A kernel-only closure is required for an operating-system target.
For another operating system, kernel-only execution is required only when that target exposes a stable, supportable kernel ABI accepted by its target contract; otherwise the contract identifies the minimum documented operating-system-provided boundary and explains why direct kernel access is not stable.
No target silently falls back from its accepted boundary to a conventional loader, host library, executable search, environment search path, or development installation.
Target-native closure details never enter `.ctx`, `.ctxl`, or `.ctxd`.

## 6. Installation and debugging

A Runtime distribution contains only the files required to execute accepted portable applications on its target, plus its manifest, licenses, integrity information, and supported-contract declarations.
An SDK distribution contains the portable development-tool closure, authoring inputs, target contracts and toolchains, its own manifest and licenses, and a declared dependency on one exact compatible Runtime; it may physically carry that Runtime, which retains its own identity and file ownership.
Installing the SDK never creates an untracked private Runtime with different behavior, and installing the Runtime alone installs no compiler, test, conformance, AOT, debugger-client, or package-authoring tools.
Portable SDK-tool identity follows `ARTIFACT-CONTRACT.md`.
The installation lifecycle requires a separate contract.
`VERSIONING-AND-COMPATIBILITY.md` governs development compatibility and the release transition.

The Runtime may read a matching `.ctxd` to enrich stack traces, failure reports, and an accepted debugger transport, and continues to execute correctly without it.
The SDK owns interactive debugger clients, source presentation, breakpoint tooling, artifact and symbol inspection, and native debug generation.
`ARTIFACT-CONTRACT.md` owns native address mapping and portable sidecar integrity.
Debugging integration requires its own design decision.
