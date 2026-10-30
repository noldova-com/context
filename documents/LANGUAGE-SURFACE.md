# CONTEXT language surface

**Scope:** TypeScript and ECMAScript source-language target, accepted source files, source compatibility profiles, compiler independence, applicability, and the compatibility exit criterion

## 1. Complete language target

CONTEXT targets the complete TypeScript 7.0.2 language for `.ts` and `.d.ts` source under the canonical strict baseline.
"Complete" means that no applicable TypeScript 7.0.2 language feature is permanently omitted because it is difficult to parse, analyze, lower, or execute; it does not include every alternate mode created by compiler options.
Until the exit criterion in section 6 is satisfied, a compatibility claim identifies its exact implemented and verified scope.

TypeScript defines syntax, binding, typing, inference, narrowing, assignability, and applicable diagnostics.
ECMAScript defines the observable runtime semantics of the accepted executable language.
CONTEXT owns its compiler architecture, portable program, Runtime, AOT implementation, package system, artifacts, and standard-library composition.

`nameof` is CONTEXT's one language addition, owned by the compiler.
It produces a compile-time constant string with no runtime effect or framework dependency.
Its exact operand surface, syntax ambiguity rule, and diagnostics are fixed before its implementation campaign.
Core's current callable and selector form exist only for the Node bootstrap and are removed when the compiler supplies the intrinsic.

`using` and `await using` belong to the target.
The compiler and Runtime preserve the disposal protocols (`Symbol.dispose` and `Symbol.asyncDispose`), reverse disposal order, asynchronous completion, disposal on normal and abrupt scope exits, and the specified `SuppressedError` behavior.
Disposal runs at the language-defined boundary: it does not establish exclusive ownership or end the managed object's lifetime, references may escape and remain observable after disposal, and storage reclamation requires independent lifetime proof that preserves cleanup timing and effects.
The TypeScript 5.2 resource-management description is a behavioral reference, not implementation code.

## 2. Strict baseline and compatibility profiles

The canonical strict baseline applies the accepted TypeScript 7.0.2 checking behavior, including strict null, function, property-initialization, iterator-return, catch-variable, implicit-type, optional-property, indexed access, override, return, unused, reachability, and casing checks where applicable.
Checks that protect TypeScript's own emission mechanics (declaration-file naming, per-file transpilation, and JavaScript downleveling) are not part of it.
`TYPESCRIPT-COMPATIBILITY.md` owns the repository profile and the exact reference invocation.

The compiler will support a limited, explicitly documented set of source compatibility settings for external TypeScript projects.
Their definitions, selection mechanism, and scope wait until representative real packages establish the need; the strict baseline remains the only specified profile.
Each future profile requires an accepted definition of its checking behavior, diagnostics, reference invocation, applicability, and cross-package contracts, with independent conformance and behavioral evidence before support is claimed.
Cases, manifests, dependencies, and command lines cannot introduce private settings or alter the reference invocation; unrecognized or unsupported settings fail explicitly.

This direction does not adopt the full `tsconfig` surface or its emission and host-resolution options.
CONTEXT owns portable emission, package resolution, artifacts, debug information, and framework selection; AOT target selection is an SDK operation after portable compilation and cannot alter source meaning; a checking setting cannot supply an absent host API or library.
Weaker checking is not evidence that a runtime value is non-null, initialized, in range, or otherwise safe: representation planning, optimization, and lowering require established semantic facts and preserve observable behavior, including failures.
A converter may assist explicit, reviewed source migration and report choices that require human intent; it is not a universal compatibility mechanism or a prerequisite for all external TypeScript.

## 3. Accepted source files

The target covers `.ts`, `.mts`, and `.cts` source files and their `.d.ts`, `.d.mts`, and `.d.cts` declaration files, parsed and analyzed by the CONTEXT frontend.
Inapplicable: `.tsx` and JSX syntax; `.js` and `.jsx` checking; JavaScript emit, declaration emit for JavaScript inputs, source-map emit, and other JavaScript-output behavior; and legacy `experimentalDecorators`.
Modern TypeScript 7 decorators are part of the required surface.
An inapplicable alternate mode is not an unsupported feature inside the accepted profile.

## 4. Compiler independence and support layers

The CONTEXT compiler owns its complete frontend and portable pipeline under `COMPILER-ARCHITECTURE.md`.
It does not use Microsoft's AST nodes, symbols or type objects, lexer, parser, binder, checker, inference engine, module resolver, transformation or emit pipeline, internal APIs, or compiler implementation as a source or runtime dependency.
Microsoft TypeScript 7.0.2 is an external behavioral oracle: the oracle generator that `TYPESCRIPT-COMPATIBILITY.md` describes may invoke the pinned compiler and record its results, and no Microsoft compiler object enters a CONTEXT phase, artifact, Runtime, or AOT compilation.

The support layers are CONTEXT's own boundaries: source decoding, lexing, and parsing; declarations, binding, symbols, and package-aware name resolution; typing, inference, narrowing, assignability, control flow, and diagnostics; sealed typed portable IR and representation; portable lowering and emission; portable Runtime behavior; cross-package behavior through validated `.ctxl` artifacts; and AOT behavior for every target for which native compatibility is claimed.
A feature is implemented only when every applicable layer has an explicit owner and supported only when every applicable layer is verified.
Type-only constructs need no runtime representation but must parse, bind, check, erase, serialize when required at package boundaries, and produce exact diagnostics; runtime-bearing constructs must additionally preserve their ECMAScript behavior through portable execution, package boundaries, and each claimed AOT target.

TypeScript import, export, module, namespace, ambient, and declaration syntax belongs to the target wherever it is independent of a host module resolver.
Physical discovery, package identity, dependency declarations, legal import roots, and `.ctxl` resolution follow `PACKAGE-CONTRACT.md`; CONTEXT reproduces no Node, npm, Classic, Node16, NodeNext, Bundler, or other resolution option as a selectable mode.
Host resolution differences are isolated from language conformance results and cannot excuse a parser, binder, type-system, declaration, or cross-package defect.

## 5. Applicability accounting

Every vendored case receives exactly one machine-readable classification.
**Applicable**: the case can be evaluated as source or declaration files of the accepted extensions under the canonical strict baseline.
**Inapplicable**: the case requires an excluded input kind, JavaScript or JSX behavior, JavaScript emission, or another alternate mode the baseline does not expose.
An upstream directive requesting weaker strictness, or an alternate mode such as legacy decorators, does not make a case inapplicable; the case is evaluated with the reference compiler under the strict baseline, and that result is the oracle.

These are never valid inapplicability reasons: not implemented yet; currently failing; unsupported by a CONTEXT phase; compiler crash, timeout, or excessive resource use; diagnostic mismatch; Runtime or AOT failure; or inconvenient runner support.
Every report states total vendored cases, applicable cases, inapplicable cases by stable reason, executed cases, passes, failures, crashes, and the exact applicable denominator; no case is lost between totals.

## 6. Exact parity and completion

Every applicable case must match the pinned TypeScript 7.0.2 reference result exactly under the canonical strict baseline, across every authoritative field, tag, occurrence, nested record, and order that `DIAGNOSTIC-CONTRACT.md` defines.
The runner may canonicalize only host-dependent path spelling and line endings through one documented deterministic procedure applied equally to both sides; it never rewrites codes, spans, messages, categories, related information, or order to manufacture a match.
Applying the reference command line's publication rule to both sides, as `TYPESCRIPT-COMPATIBILITY.md` section 4 does, compares what the reference publishes and rewrites nothing.
Reference results are produced mechanically and never hand-edited; CONTEXT results are produced independently through the public compiler boundary.

Complete frontend compatibility requires:

```text
applicable diagnostic cases passed / applicable diagnostic cases = 100%
frontend crashes = 0
unaccounted cases = 0
```

Code-match, span-match, message-match, and related-information metrics may be reported for investigation; only the exact combined result is a pass.
During implementation, a reviewed committed baseline may record incomplete progress: verification reads it and fails on any regression, new mismatch, crash, missing case, or applicability drift, never rewriting a tracked baseline or ledger.
Moving a failing case to the inapplicable ledger is not an improvement unless the case objectively falls outside the baseline under section 5.

Exact diagnostic parity proves frontend agreement only for the behavior the corpus exercises.
Runtime-bearing features additionally require independent behavioral tests through portable Runtime execution, separately compiled and installed `.ctxl` dependencies, every claimed AOT target, boundary and malformed-input cases, and the generation and artifact-identity gates.
`VALUE-SEMANTICS.md` owns observable value behavior.

## 7. Framework and library boundary

The language target and the standard library are separate authorities.
Supporting syntax or a type-system feature does not imply that a particular global, host API, DOM API, Node API, or package exists, and a library cannot redefine syntax, typing, or ECMAScript semantics.
Framework references select declaration environments through the package model under `FRAMEWORK-CONTRACT.md`; they do not expose TypeScript's `lib` option, and optional Web, Worker, experimental, or future environments are exact framework compositions, not per-file compiler modes.
A missing or unimplemented declaration required by the selected framework is a failure, not an inapplicability reason; a symbol absent because its optional environment was not selected follows the exact applicable missing-symbol behavior; and a framework's mapping of an upstream interface or type alias to a concrete class is not an inapplicability reason either.
Complete compatibility cannot be claimed while any library-dependent case is unaccounted.

Changing the accepted file kinds, the strict baseline, or a compatibility profile requires a change to this document and the evidence in section 2.
No implementation or package introduces a private language mode, per-package exception, compatibility flag, or hidden fallback.
