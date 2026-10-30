# CONTEXT TypeScript compatibility

**Scope:** TypeScript toolchain pins, the strict repository profile, conformance intake, the expected diagnostics, and pin upgrades

## 1. Two version authorities

| Authority | Pin | Purpose |
|---|---:|---|
| Package compiler | TypeScript 7.0.2 | Checks and emits repository-owned packages through the `tsc` command line |
| Language compatibility reference | TypeScript 7.0.2 | Defines the behavior the CONTEXT frontend is specified and measured against |

The pins are equal today but remain separate decisions, never one ambiguous "TypeScript version" setting.
`VERSIONING-AND-COMPATIBILITY.md` governs external version authorities, and Noldova's [TypeScript standard](https://github.com/noldova-com/.github/blob/main/standards/stacks/TYPESCRIPT.md) requires exact dependency pins.
`BUILD-AND-VERIFICATION.md` owns bootstrap installation and lockfile policy.

## 2. Package compiler

TypeScript 7.0.2 is the compiler of record for repository-owned packages.
Builds invoke its `tsc` executable and do not require the programmatic API.
TypeScript 7.0 is the production release of Microsoft's native Go port; it provides no supported stable programmatic API (Microsoft expects one from 7.1), and its explicitly unstable exports are not accepted dependencies of any package, build, or verification run.
Oracle generation is their one use: the command line reports no span, length, chain, related information, or tag, which are the fields `DIAGNOSTIC-CONTRACT.md` compares, so the generator drives the pinned compiler through `typescript/unstable/sync` over a hermetic virtual file system, once per pin or invocation change and for the intake's certification, as repository automation that nothing built or shipped depends on.
CONTEXT uses no TypeScript 6 compiler, compatibility API, package, or alias such as `@typescript/typescript6` or `@typescript/old`.
A task that appears to require the legacy API uses the TypeScript 7 command-line boundary or waits for the applicable CONTEXT-owned parser or tool.

## 3. Strict repository profile

Every repository-owned TypeScript project uses the strictest applicable TypeScript 7 checks through the root `tsconfig-base.json`, which is inherited policy, not a compilation root: every package or tooling directory owns a scoped `tsconfig.json` that extends it, so automatic file discovery stays inside that directory and never absorbs sibling packages or vendored inputs.
A package may add constraints, paths, libraries, and emit settings; it may not weaken the profile, and there are no package-specific escape hatches.
A necessary change is made in this document and applied to all packages.

```json
{
  "compilerOptions": {
    "target": "ES2025",
    "lib": ["ES2025", "ESNext.Disposable"],
    "strict": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true,
    "noUncheckedSideEffectImports": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "noEmitOnError": true,
    "noErrorTruncation": true,
    "skipLibCheck": false,
    "verbatimModuleSyntax": true
  }
}
```

`strict: true` owns the complete strict family; the other checks are stated because `strict` alone does not enable them.
Projects that emit declarations also use `isolatedDeclarations: true`.
Options such as `erasableSyntaxOnly` are not strictness settings and are adopted only through a separate language and emit decision.

`target: ES2025` with `lib: ["ES2025", "ESNext.Disposable"]` is an emission and host-library decision for the exact Node pin: ES2025 supplies the decorator lowering Node 24.21.0 requires, and the additional library enables typed `using`, `await using`, and disposal APIs.
TypeScript emits cleanup machinery that uses disposal APIs supplied by the pinned Node host.
Library declarations supply types, not implementations; a target or library change requires renewed checking, build and test verification, and execution witnesses for newly used host features.
This profile configures the external compiler for repository code; it exposes no option in the CONTEXT compiler.

## 4. Conformance intake

The TypeScript conformance suite is an external behavioral oracle, not source architecture or implementation code.
Its home is the test project of the package it measures, `noldova.context.parsers.typescript/tests/conformance/`, in the shape `TESTING-CONTRACT.md` section 7 gives every imported suite, with `baselines/`, `diagnostic-definitions/`, and `libraries/` added for what its answers need; `PROVENANCE.json` records the exact TypeScript version, upstream repositories, commits, source roots, local roots, and file counts.
The cases are every file from both pinned case roots before applicability classification, including JavaScript and JSX cases that `LANGUAGE-SURFACE.md` classifies as inapplicable, and only `*.errors.txt` baselines.
`diagnostic-definitions/` holds the pinned classic catalog and the TypeScript-Go additions that overlay it by code.
`libraries/` holds every `lib*.d.ts` of the exact distribution as external library-surface evidence, never production source, a framework package, a Runtime input, or a package build dependency.
Every vendored file retains its upstream bytes and copyright, is never hand-edited, and receives no Noldova header; a reference upgrade replaces the complete affected intake.

`npm run vendor:typescript -- <version>` performs the intake: it fetches each upstream source at that version's pin from its authority, replaces every vendored directory with the declared selection, records the pin, roots, and counts in `PROVENANCE.json`, and regenerates the expected diagnostics below with `npm run generate:typescript-expected-diagnostics`, discarding any checkpoint of an earlier run.
Run again under an unchanged pin, it must reproduce the committed intake and expected diagnostics byte-identically, the manifest excepted only for the attempts it seals for a case it had to ask again.
That rerun certifies that the intake is the pinned upstream selection, unchanged, and that the expected diagnostics are reproducible from it under the canonical invocation; it does not show that the splitting rule or the extraction matches the reference harness.
The intake's `CERTIFICATION.md` records each such run.

`npm run generate:typescript-diagnostics` regenerates the TypeScript diagnostic-template catalog owned by `noldova.context.parsers.typescript`.
Normal builds verify that the checked-in catalog matches the pinned inputs and fail rather than rewriting tracked source.

### Pragmas, baselines, and the expected diagnostics

Upstream cases carry `// @option:` pragmas with two roles.
The input-shaping pragmas `@filename` and `@lib` define a case's effective inputs and declaration environment; every evaluation honors them, and applicability is judged on the effective inputs after `@filename` splitting.
Configuration pragmas such as `@strict`, `@target`, and `@noImplicitAny` record how the external compiler was configured when the baseline was generated; the canonical strict baseline overrides them, and they never make a `.ts` or `.d.ts` case inapplicable.

A case is split as the reference harness splits one.
A file is decoded by its byte order mark, UTF-16 in either byte order or UTF-8, and the mark is not content.
A line is ended by a line feed with or without a carriage return before it, so a lone carriage return is content; a directive is a line that begins `// @name: value`, removed from the content whatever follows the value; `@filename` begins a unit named by its value; what precedes the first `@filename` is not an input; a unit's leading empty lines are not content; a unit name is a path under one case root however it is written; and a name written twice names two units of which the one written last is what is mounted.
A unit is classified by its own extension: `.ts`, `.mts`, `.cts`, and their declaration forms are `Source`; `.json` is `Environment`, mounted but never compared; `.js`, `.jsx`, `.cjs`, and `.mjs` are `JavaScript`, `.tsx` is `Jsx`, and anything else is `Other`.
A case that writes no source unit, or any excluded kind, is inapplicable, and its reason is the excluded kinds it writes joined by `+`, or `Other` when it writes no source.
Every unit is mounted, and the roots of the case's project are the ones the harness compiles: only the last unit when it reaches the others itself through a reference directive or a `require` call, or when `@noImplicitReferences` says so, and otherwise every unit.
A unit named `tsconfig.json` is an ordinary input, never the project.
Directives that shape a file system rather than a checking profile, such as `@currentDirectory`, `@link`, `@symlink`, `@typeRoots`, `@types`, and `@noResolve`, are configuration and are overridden like any other; the cases that write them are evaluated without the file system they describe.

The vendored `*.errors.txt` baselines therefore record the pinned compiler's results under each case's own configuration and are not the expected diagnostics.
They are upstream evidence and never an input of the conformance comparison: CONTEXT evaluates every case under the canonical invocation alone and does not reproduce them.
An absent baseline records zero diagnostics under the case's own configuration; the expected diagnostics and the known-failures ledger record an explicit result for every applicable case, never inferring one from file absence.

The expected diagnostics are one mechanical run of the pinned compiler over every vendored case under the canonical invocation below, committed under the test project's `conformance/expected/` as derived, reviewed evidence: never hand-edited and regenerated, by `npm run generate:typescript-expected-diagnostics`, only when the pin, the invocation, or the splitting rule changes, and by the intake's certification run, which must reproduce them.
It holds one record per case in path order, an applicable case with every diagnostic the reference reported and an inapplicable one with its reason, and a manifest naming the pin, the invocation and its hash, the splitting rule, and the accounting; the package build verifies all three against the generator and verifies the records against the manifest and never regenerates them.
A record holds every diagnostic the reference reported, family by family in the order its command line collects them: the project file's parsing diagnostics, the units' syntactic diagnostics in the program's file order, the program's option diagnostics, the global diagnostics, the units' semantic diagnostics, and the units' suggestions; each family keeps the order the reference returned it in and is never sorted.
The command line publishes the parsing and syntactic diagnostics, adds the option and global ones only when those are empty, adds the semantic ones only when all of those are empty, never publishes suggestions, and sorts and deduplicates what it publishes; a comparison takes that from the families rather than the record deciding it.
Binder-only and declaration-emit queries report what the invocation does not and are not recorded.
A file the reference names is recorded as the unit's index, a vendored library's name under `libraries/`, or `tsconfig.json` for the project; a message names a unit under the `/case` root every case is mounted at, the project as `/tsconfig.json`, and a library under `libraries/`.
A case whose evaluation ends abnormally, because the reference process died, ran past its time, or took more than the memory budget, is asked about again up to a fixed number of attempts, and every such attempt is sealed in the manifest beside the answer; a case that never answers blocks the seal.
CONTEXT results are compared only against those expected diagnostics, through the fields `DIAGNOSTIC-CONTRACT.md` defines and the exit criterion `LANGUAGE-SURFACE.md` owns.

### Canonical reference invocation

```json
{
  "compilerOptions": {
    "noEmit": true,
    "target": "esnext",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "noErrorTruncation": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true,
    "noUncheckedSideEffectImports": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": false,
    "types": []
  }
}
```

An option belongs to the invocation only when it shapes the accepted language.
Options protecting TypeScript's own emission mechanics (`declaration`, `isolatedDeclarations`, `isolatedModules`, `verbatimModuleSyntax`, and JavaScript downleveling) are excluded because CONTEXT does not inherit them; the repository profile in section 3 keeps its own stricter emission settings as a separate authority.
The non-obvious selections: unused and reachability checks are included because users live under them, and the expected diagnostics are never weakened for readability; `target: esnext` because CONTEXT performs no downleveling and an older target would import feature-availability errors; `module: esnext` because the accepted language is standard ECMAScript modules; `moduleResolution: bundler` because the corpus imports `@filename` siblings by extensionless specifiers, and Node-style mandatory extensions would flood it with loader diagnostics that belong outside language conformance; `noErrorTruncation` because truncation is presentation; and `types: []` to keep the invocation hermetic.
`lib` is left unset deliberately: the compiler's default for the target, `lib.esnext.full.d.ts`, is the environment the corpus was written against, and a case's `@lib` directive replaces it.
JSX, JavaScript checking, and legacy `experimentalDecorators` remain unset.

Changing any part of this invocation is a language change requiring a reviewed change here, complete regeneration of the expected diagnostics, and a fresh independently measured CONTEXT baseline.

### Conformance ownership

Conformance execution belongs to the tests of the package whose behavior it measures, and no conformance package is created: the TypeScript frontend's own test project holds the cases, the expected diagnostics, and the runner that reads them by repository-relative path, so nothing conformance-related lives outside the package it measures.
A run measures only what the package under it implements, and its claim names that scope; a scope no single package covers waits for the package that covers it.
The runner is an ordinary test class of that test project, one test per applicable case under the `TypeScriptConformance` category, so it runs with every `npm run test` and is selected like any other test; `BUILD-AND-VERIFICATION.md` names it within the test gate.
The reference-compiler invocation is confined to generating the expected diagnostics at pin, invocation, or splitting-rule changes and for the intake's certification; routine verification runs only the CONTEXT compiler against the committed expected diagnostics.
The runner reads each case through the same splitting rule as the generator and checks every unit it produces against the hash the expected diagnostics recorded; compares both sides through the codes the package's own source names, the units the program held, and the publication rule of the reference command line, applied unit by unit because a parser reads one unit at a time and can know nothing of another unit's syntax, where the checker's run will apply it to the whole program; compares every field `DIAGNOSTIC-CONTRACT.md` section 13 lists in what that rule publishes, merging the related information of repeats as the reference does; reports the case, the diagnostics missing and the diagnostics extra; fails on a crash, a missing case, a hash that no longer matches, or accounting drift between the manifest and the records; and performs no tracked-file writes.
Incomplete progress is recorded in the test project's `conformance/known-failures.json`, the committed ledger `LANGUAGE-SURFACE.md` allows: it names each applicable case the package does not yet match with its exact difference, the diagnostics missing and the diagnostics extra as structured records, and states its totals, counting the stated differences and the checker's cases apart from the failures.
The runner fails on a case that leaves the reference's answer, on a known failure whose difference is not the one recorded, and equally on a known failure that now matches it.
Under the expected diagnostics it was measured against, which it names by the hash their manifest seals, the ledger is edited only to remove the cases and the differences that now match, and review names in its classification lists the cases `DIAGNOSTIC-CONTRACT.md` section 7 records as stated differences or as the checker's.
`npm run generate:typescript-known-failures` makes that edit from a complete comparison run by the test project's own code: it removes every case that now matches, narrows each remaining case to what still differs, keeps each remaining case's classification, and refuses to record a case or a difference the ledger does not already hold.
Once the expected diagnostics change, the same command writes a new ledger measured against them, and review classifies its new failures.
No temporary harness or third-party framework is introduced.

### Standard-library surface inventory

The inventory consumes every declaration file in the pinned `libraries/` intake and never infers a global's surface from one file.
Declaration merging produces canonical identities without discarding the source file, span, fragment, member, overload, augmentation, or deprecation provenance of any upstream entry, feeding the ownership ledger of `LIBRARY-TOPOLOGY.md`.
CONTEXT additions are recorded separately and never represented as TypeScript entries; deliberate mappings from upstream interfaces or type aliases to concrete CONTEXT classes are recorded while the inventory remains an exact upstream inventory.
The CONTEXT-owned parser and semantic model will produce it mechanically; until then a reviewed campaign inventory may guide implementation but cannot certify completeness, and Microsoft compiler APIs are not used to produce it.
Changing the pin regenerates and compares the complete inventory.

## 5. Pin upgrades

The two pins are upgraded through separate decisions; either may move first.
A package-compiler upgrade requires an exact candidate version; a review of release notes, removed options, defaults, and emit changes; successful checks, tests, coverage, and builds under the strict profile; and an explicit manifest and documentation update.
A compatibility-reference upgrade requires an exact candidate release and upstream pin; a reviewed language and standard-library delta; a complete fresh intake from the new roots; regenerated reference diagnostics and complete applicability accounting; a new independently measured CONTEXT baseline; and explicit documentation of compatibility status and intentional divergence, with complete-compatibility wording forbidden until the exit criterion is restored.
Nightly or prerelease builds may be used for investigation but never become a pin without an explicit decision.

## 6. Evidence

Microsoft's TypeScript 7.0 announcement identifies TypeScript 7 as the released native Go compiler, documents installation through the `typescript` npm package and `tsc`, and states that 7.0 has no supported API:

- <https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/>
- <https://github.com/microsoft/typescript-go/releases/tag/typescript%2Fv7.0.2>
- <https://registry.npmjs.org/typescript/7.0.2>
