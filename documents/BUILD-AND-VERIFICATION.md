# CONTEXT build and verification

**Scope:** Bootstrap automation, package build, packing, installation, testing, verification gates, self-host generations, and performance evidence

## 1. Proof boundaries

A successful build proves that the selected source was accepted and its expected outputs were produced; a test run proves only the behavior it exercised; byte-identical generations prove deterministic reproduction, not correctness; and a runtime, ABI, loader, or platform claim requires its own execution witness.

## 2. Bootstrap build

```text
npm run build
  -> select packages from the explicit temporary bootstrap configuration
  -> for each selected package in configured dependency order:
       compile through TypeScript 7 against installed npm dependency packages
       include public declarations under the package's accepted documentation path
       include the license and the package's README.md, failing when the README is missing
       pack the freshly built package
       install it into the root node_modules environment

npm run test
  -> compile the separate test projects against the installed packages
  -> run noldova.context.testing
  -> enforce complete production coverage
```

Complete current verification is an all-package build followed by the complete test and coverage gate for the same source state; the test command does not rebuild production packages.
`npm run build -- <package>...` accepts configured canonical package names in their configured order and computes no dependency closure; required dependencies must already be built and installed.
Selected-package builds and targeted tests are investigation tools, not the gate.

The root configuration explicitly lists bootstrap packages in dependency order.
It is not the final solution graph: the Runtime-hosted SDK build provider will read `.ctxs` and `.ctxp`, resolve the graph under `PACKAGE-CONTRACT.md`, and replace the list, the shared bootstrap bases, and the package build scripts.
Each package is compiled against installed packed dependencies: npm packages during bootstrap, `.ctxl` artifacts later.

Build requirements: stale outputs and prior installed CONTEXT packages are removed before use; generated output is confined to declared generated directories; tracked source, manifests, and package metadata finish unchanged; build commands never change declared versions or publish packages; packing consumes only the freshly built package contents; installation into root `node_modules` consumes the freshly packed artifacts, not source directories; the root `package-lock.json` is committed and pins every third-party package, which the build installs with `npm ci` when `node_modules` is missing, while the freshly packed CONTEXT packages are installed with `npm install --no-save`, so they never enter the manifest or the lockfile, as Noldova's [TypeScript standard](https://github.com/noldova-com/.github/blob/main/standards/stacks/TYPESCRIPT.md) requires; and failure of any dependency, build, pack, or install step stops the workflow before dependants run.
Loose compiler output alone is not a completed build.

### Scripts

npm commands select TypeScript entry points and pass arguments; the pinned Node runtime executes those files directly, with no inline shell workflow.
Do not add a TypeScript runner while Node can execute the required entry points.
Node, npm, TypeScript, and Node declarations are exact bootstrap requirements in `package.json`.
Package-specific scripts live in the owning package's `scripts/`; root scripts contain only repository-wide entry points and their explicit bootstrap composition.
A package has a build script only when it adds steps beyond the default compile; otherwise the root build runs the default itself.
A substantive domain implementation belongs to a named class in its owning package, and a growing repository-wide subsystem becomes a tooling package with `src/` and `tests/`.
Add scripts only for present accepted work.

Root and package automation classes extend `Script`, whose protected operations own process and bootstrap-tool execution, logging, package selection, filesystem work, and common package steps such as declaration copying.
Each derived script keeps its workflow in `runAsync` and reuses or overrides those operations without duplicating them or adding another base.
A narrow correction does not authorize adjacent changes to inheritance, workflow, names, or output.
For packages that have not migrated documentation generation, `Build` copies the manual `src/api/index.d.ts` unchanged into the npm package.

The stage-zero root and package scripts that construct Testing are temporarily outside its mirrored unit-test and coverage boundary; strict compilation and the complete build and test workflow verify them.
That exception ends when the workflows move into a Testing-capable tooling package or SDK provider, and it covers no other automation.
A package's own bootstrap automation, such as the TypeScript and Regex parsers' vendoring and generator scripts, is recorded beside that exception on the same terms: its `scripts/tsconfig.json` compiles under the strict profile in the package build, it throws the host `Error` as the root scripts do, and the certification rehash verifies what it produces.
Each parser package's build fails when its committed expected results are missing, were generated under another pin or reading rule, or no longer match the hash their manifest seals; only the vendoring and generator commands read the cases again.

Launch processes with an executable, argument array, explicit working directory when needed, and `shell: false`; construct no shell command strings, pipes, redirects, globs, or platform-specific environment syntax.
Use runtime filesystem, path, URL, process, and hashing APIs; portable workflows contain no hard-coded drive letters, separators, executable suffixes, or host directory conventions.
Declare and validate external facilities before use: no globally installed tool is an implicit prerequisite, and a platform-specific operation has a named owner that validates its platform.
Every entry point works from a clean clone on every supported development platform.
Guards reject prohibited script languages, inline shell workflows, and shell-enabled process execution as tooling becomes available.

## 3. Test gate

`npm run test` runs the complete suite through `noldova.context.testing` against freshly installed packages in root `node_modules`; package-name resolution must reach installed packed artifacts, never source files or stale output.
The canonical run requires a successful build and installation for the same source state, follows the strict and coverage rules, and leaves tracked files unchanged.
`TESTING-CONTRACT.md` owns execution, result accounting, skips, and filter semantics.
`npm run test -- <filter>...` forwards filters to the runner; a targeted run skips the coverage gate.

TypeScript conformance runs inside this gate as the parser package's `TypeScriptConformance` tests, one per applicable case, against the committed expected diagnostics and known-failures ledger `TYPESCRIPT-COMPATIBILITY.md` owns; the exit criterion is `LANGUAGE-SURFACE.md`'s, and until the ledger is empty the result measures progress only.
Regex conformance runs in it likewise, as the Regex package's `RegexConformance` tests, one per applicable Test262 case, against the expected patterns and ledger `TESTING-CONTRACT.md` section 7 owns.
Standard-library surface verification is another: for every global claimed complete, it compares the implementation and public metadata with the exact generated inventory and requires zero missing, duplicated, misowned, unaccounted, or untested applicable entries, with runtime-bearing entries verified through the installed package and every relevant Runtime or AOT path.
Until the inventory and its tooling exist, investigative checks may guide implementation but cannot support a completeness claim.
Runtime and platform witnesses are further named gates.
Gates may be composed into a certification profile; none is silently counted as an ordinary unit test.

## 4. Future self-host certification

When self-hosting is available, the generation chain compiles the same accepted compiler solution, package set, targets, and inputs repeatedly:

```text
TypeScript 7 / Node-hosted bootstrap    -> gen1 portable compiler
Runtime executes gen1 portable compiler -> gen2
Runtime executes gen2 portable compiler -> gen3
Runtime executes gen3 portable compiler -> gen4
Runtime executes gen4 portable compiler -> gen5
```

`gen1` is the bootstrap generation produced through the TypeScript and Node host; each later generation is produced by the immediately preceding generation's portable compiler under one exact recorded Runtime.
The portable compiler is the canonical self-host tool; an AOT-derived native form is a separate witness and never a second compiler authority.
Every generation is snapshotted before the next begins, with a sorted manifest of every deterministic artifact's relative path, size, and cryptographic hash.
Every generation after `gen1` is compared directly with `gen1`.
A successful chain has exactly the requested generations, a non-empty artifact set in each, the same paths and counts throughout, evidence that every artifact was freshly produced, and byte identity for every artifact.
An artifact may be excluded only when an accepted contract identifies a necessary nondeterministic field, explains why normalization is inappropriate, and defines an independent check.

| Profile | Required work | Claim |
|---|---|---|
| Investigation | Selected package build, targeted tests, or one compiler execution | Diagnostic evidence only |
| Smoke | Current-state build and relevant tests, then exactly `gen1`–`gen2` | Fast bootstrap-to-portable comparison; never certification |
| Normal | Complete build, pack, clean install, complete tests, then exactly `gen1`–`gen3` | Normal landing certification |
| Full | Complete build, pack, clean install, complete tests, exactly `gen1`–`gen5`, and every scope-required conformance, runtime, ABI, loader, and platform witness | Major milestone, release, format, ABI, or runtime change, or campaign exit |

Three generations are the normal minimum because `gen1 == gen2` crosses the bootstrap-to-Runtime boundary and `gen2 == gen3` independently exercises portable self-reproduction; four generations have no distinct meaning.
Certification commands never skip their build or test stages, and npm exposes the TypeScript entry point that owns profile selection without duplicating the workflow.

A change expected to be byte-neutral for a declared set of code-bearing or semantic artifacts is additionally compared literally against the last reviewed accepted manifest, and any unexpected difference fails.
Source-sensitive artifacts may remain cross-generation-only only when their different cross-change behavior is explicitly documented.
A change that intentionally alters artifacts must still produce identical generations and behavioral evidence for the new output; the accepted manifest changes only through a separate deliberate repository change after review.
Every certification run records the source identity, product and schema versions, toolchain versions, compatibility identities, profile, targets, and counts; begins from clean generated and installation state; fails loudly on missing, stale, duplicate, or unexpected outputs; writes only beneath declared generated paths; and modifies no tracked source, manifest, test, or baseline.

## 5. Host and target execution

Noldova's [code standard](https://github.com/noldova-com/.github/blob/main/standards/CODE.md) owns automation and interactive shells.
On a Windows host, a declared cross-toolchain may compile Linux-targeted native artifacts without moving the workflow into WSL; cross-compilation proves only that the artifacts were produced.
WSL2 is the initial Linux-native execution environment for Windows hosts.
A Linux runtime or loader claim requires an applicable Linux execution witness, which may run under WSL2 when WSL2 faithfully supplies the capability under test; it does not certify another kernel, architecture, device, or environment.
Evidence records the actual host, target, toolchain, and execution environment so that host compilation, cross-compilation, and target execution are never conflated.

## 6. Performance evidence

Material performance claims and optimizations use representative workloads and increasing input sizes, recording the source state, versions, target, build configuration, inputs, and measurement method, and measuring execution time and, where supported, peak memory, allocations, retained memory, and GC work; an unavailable measurement remains unavailable, not zero.
Keep correctness and scaling witnesses separate, compare an optimized algorithm against a simple reference where practical, and measure timing in repeated runs outside coverage; ordinary unit tests carry no machine-dependent thresholds.
Node-bootstrap measurements inform algorithm and allocation reviews but do not establish native performance; a comparison with native code requires equivalent work, required semantics, and recorded conditions.
Claims name the measured workloads, and neither instruction counts nor more statically reclaimable allocations alone proves an improvement.
Do not add benchmark infrastructure or production instrumentation without a present, scoped need.
