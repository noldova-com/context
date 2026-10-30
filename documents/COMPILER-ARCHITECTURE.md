# CONTEXT compiler architecture

**Scope:** Source compilation, package compilation units, phase ownership, portable program production, and the AOT input boundary

## 1. Two compilers

CONTEXT has two separate compiler responsibilities inside the SDK:

- The **source compiler** consumes one project's TypeScript source, manifest, explicitly selected language profile, and validated portable library dependencies.
  It produces one portable `.ctxl` for a library project or `.ctx` for an executable project and, when requested, one optional `.ctxd` sidecar.
- The **AOT compiler** consumes an already-produced portable `.ctx` or `.ctxl` root, its exact transitive `.ctxl` dependency closure, and one target contract.
  It produces target-native artifacts.

The source compiler emits no target-native artifact and never branches on an AOT target; AOT never causes a second target-conditioned source compilation.
The AOT compiler compiles no TypeScript source and cannot consume syntax trees, frontend semantic state, or another private source-compiler representation.
The Runtime and the AOT compiler are sibling consumers of portable artifacts:

```text
TypeScript package source
  -> source compiler
  -> portable .ctx or .ctxl
       -> target-native Runtime validates, loads, and executes
       -> SDK AOT compiler validates and translates for one target
```

## 2. One project is one compilation unit

Every project is a separate compilation unit.
A solution coordinates project builds; it does not create a solution-wide semantic compilation.
For a dependency chain `Application -> LibraryA -> LibraryB`, the order is: resolve and validate the complete graph; compile, pack, and install LibraryB; compile LibraryA against the installed `LibraryB.ctxl`, then pack and install it; and compile the application against both installed artifacts.

A package compilation receives only its exact validated manifest and declared build inputs; its own declared sources; exact validated `.ctxl` artifacts for every direct dependency and its declared transitive closure; the exact effective framework `.ctxl` closure and exposure rules; the accepted compiler, language-profile, and artifact-contract inputs; and explicitly declared deterministic build inputs.
It does not receive a dependency's source files, syntax trees, semantic program, mutable compiler session, loose build output, or checkout path.
The imported `.ctxl` closure supplies every semantic and runtime fact required at the package boundary.
`PACKAGE-CONTRACT.md` owns source-import permissions.

The build owner compiles requested packages and their transitive in-repository dependencies in deterministic topological order, packing and installing each dependency before a dependent compilation begins.
A missing, failed, malformed, wrong-kind, ambiguous, cyclic, or incompatible dependency stops the workflow before the dependent package is compiled.
Compiling a package through a solution and compiling it directly against the same installed dependencies must produce byte-identical portable artifacts.
Independent graph branches may run concurrently only after all of their own dependencies are available.

Test libraries follow the same boundaries: an ordinary `.ctxl` compiled after its declared dependencies are installed, discovered and executed by the test runner under `TESTING-CONTRACT.md`.

## 3. Source-compiler phase graph

```text
resolved project compilation input
  -> dependency artifact validation and import projection
  -> syntax
  -> semantic analysis
  -> typed portable IR
  -> portable representation planning
  -> portable lowering
  -> portable artifact emission
```

The phase outputs are architectural roles; their exact classes, record schemas, and serialization are later implementation decisions.

| Phase | Accepted input | Sealed output | Exclusive responsibility |
|---|---|---|---|
| Dependency intake | Exact installed package and framework `.ctxl` closure | Imported package contracts | Validate artifact kind, identity, dependency relation, framework exposure, augmentations, initialization requirements, compatibility, and contract completeness; expose only declared direct dependencies and framework-authorized roots |
| Syntax | Declared source inputs | `SyntaxProgram` | Lexing, parsing, immutable syntax, and source locations |
| Semantic analysis | `SyntaxProgram` plus imported package contracts | `SemanticProgram` | Declarations, symbols, types, binding, accessibility, inference, narrowing, assignability, exact members and calls, control-flow facts, captures, and source-language diagnostics |
| Typed portable IR | Sealed `SemanticProgram` | `TypedProgram` | Explicit typed control flow, values, storage, operations, call targets, and package identities |
| Portable representation | Sealed `TypedProgram` plus the portable Runtime contract | `PortableRepresentationPlan` | Target-independent storage forms, layouts, transitions, and lifetime and GC classifications required by portable execution |
| Portable lowering | `TypedProgram` plus `PortableRepresentationPlan` | `PortableProgram` | Expand high-level operations into the complete target-independent executable model |
| Artifact emission | Sealed portable and public-contract inputs | `.ctx` or `.ctxl`, plus optional `.ctxd` | Canonical serialization, required package and runtime metadata, integrity data, and optional developer information |

No phase performs work owned by an earlier phase.
A later representation may transform an established fact; it may not discover, replace, or guess that fact.

### Parsers

`noldova.context.parsers` owns the generic UTF-16 source buffer, offset-only locations, cursor navigation, the immutable node foundation, source line mapping under a host-selected Text `LineTerminator`, and the parser and lexer contracts shared by language parsers.
It owns no language grammar, language-specific node identity, trivia policy, or diagnostic catalog; those belong to the language package, as do lexical policies such as TypeScript whitespace and shebang recognition.

Its parsing contract is documented in the package's public API.
The parser holds one current node and no token cache.
`lookAhead` performs Boolean recognition and always restores the current node, the reader offset, and the diagnostic sequence.
`tryParse` runs the actual grammar, keeps a defined result, and restores that same state on `undefined` or an exception, rethrowing the exception.
A rewound region is lexed again.
The lexer and the grammar report into one diagnostic sequence, owned by the parser context, in the order they report, so a lexical diagnostic is visible the moment its node is lexed and grammar decisions may consult the sequence.
A rewind truncates the sequence to its saved length; nothing is ever removed from its middle.
Contextual re-lexing rewinds to the current node's start and lexes again without removing anything; a language whose scans can repeat a diagnostic at the same position applies its own suppression rule, as TypeScript's same-offset rule does.
Neither operation snapshots state added by a language's lexer or parser context, or permits mutation of existing nodes; the language owner restores its own mutable state.
A parser session permits one root-parse attempt.
AST leaves may share immutable lexer nodes; do not clone them to simulate exclusive ownership.

A parser context owns shared grammar state and recognition caches; an internal syntax parser owns private grammar services.
A public parser exposes input and results, not those services or token navigation.
The generic `Node` carries no operator behavior: a language package declares precedence and associativity through its own node extension and assigns them through the exact operator node's extension, and a grammar parser retains only context-dependent rules such as whether TypeScript `in` is permitted at the current position.

Sub-parsers receive their syntax driver directly, not through an unrelated grammar service.
A `parse(...)` entry states where parsing starts, which already-parsed operands it consumes, and where it leaves the current token.
Operands and per-call precedence belong to that invocation, never a shared "last expression" field.
Shared grammar state belongs to the context and is restored on leaving its scope.
Reuse an existing expression only when its parsing context remains compatible.
Controlled tentative parsing may resolve grammar ambiguity, but must prevent repeated nested work.

A syntax tree writes every child its grammar requires, as a missing node at the least where the source lacks it, and the child's node declares it required, as the reference's tree does; only a child the source may omit is optional.
A child present only in some contexts stays optional, as a block's opening brace does: a statement always writes one, and a recovered body may lack it.
The tree never invents a token: a delimiter, operator, keyword, or literal token the source lacks stays absent where the reference writes a missing token, and a list whose opening delimiter is missing is still written, empty and zero-width, as the reference writes it.
Such a list and a missing node sit at the end of the preceding token, where the reference places them, and carry no trivia, so a parent ending with one ends where that token does.
An optional child the grammar has begun to read is written missing where the source lacks it, as a `break` or `continue` label is where the keyword's line goes on, and a list ends at the last token it read, a token its recovery skipped included, as the reference's does.

TypeScript syntax recovery and the legality diagnostics that follow it have separate publication rules, not separate full-tree traversals.
The legality diagnostics are the binder and checker checks `DIAGNOSTIC-CONTRACT.md` section 7 lets syntax host until semantic analysis takes them over.
Concrete node extensions check a construct when its grammar owner finishes it.
Deferred diagnostics use the existing rollback behavior: the records they are read from belong to one records model the parser context owns, which tentative parsing marks and releases, and a reparsed region's reading replaces every record the first reading made inside that region.
A legality diagnostic is read from the finished construct and published only where syntax parsing of the source completes without errors, because the reference publishes nothing it reads from a tree whose source failed to parse; the reference's own parser reports the rest as syntax.
A regular expression's own diagnostics are no syntax error: the reference's checker reports them beside the legality diagnostics.
A `@ts-nocheck` comment written before the first token withholds every legality diagnostic, since the reference checks nothing in that source.
Where the reference's checker never looks, what it would report is withheld and what its binder reports stands: a `with` body, a decorator nothing carries, a global export, an import type's type arguments and attribute values, the members written after a mapped type's template, and an initializer the reference reads only for a use, which is a signature's parameter initializer unless a pattern written without a type reads its type, and a `for...in` declaration's initializer unless a pattern reads it or the declaration redeclares an earlier variable, which semantic analysis decides by resolving the name.
A `@ts-ignore` or `@ts-expect-error` directive withholds what is read from the line after it, looking back over blank lines and line comments only.
A source is parsed before it is checked, so the parser publishes its syntax diagnostics before its legality diagnostics, each in source order, the narrower span first where two start together, the lower code first where two share a span, and by message where two share a code; a diagnostic repeating another's code, span, and message is published once.
These checks neither mutate syntax nor perform name binding or type checking.

The shared parser offers rewind, not capture and replay of completed work, and no parse memoization.
Whether a language must bound repeated work for its own ambiguities, and how it does so, is decided with that language's parser.

The TypeScript bootstrap bounds active recursive grammar entries across expressions, types, binding patterns, and statements.
Its public API owns the limit and interrupted-result contract.
Check before deeper recursion and unwind the counter on every exit, including tentative parsing.
On reaching the limit, stop the bounded session with a CONTEXT implementation diagnostic, retain completed top-level statements, and preserve the unfinished statement and remaining input as unparsed syntax.
Do not guess a resumption point or catch a host stack overflow as if it were the checked limit.
This is a failed conformance case, not an excluded language feature.
Independently fix and measure repeated grammar work; a recursion limit does not establish efficient parsing of flat input.
The bound remains a bootstrap implementation policy, not a TypeScript language restriction or a future Runtime requirement.

## 4. Mutation, sealing, and lifetime

A phase may use private mutable builders, indexed worklists, and caches while it owns its computation; mutation does not cross the phase boundary.
Every published phase result is complete for its declared scope, immutable to downstream consumers, verified before publication, deterministic for the same declared inputs, and independent of the builders that produced it.
A phase that cannot satisfy its seal conditions publishes nothing; builders and worklists are released after sealing.
No general `Compilation`, context, session, service locator, or mutable property bag crosses the pipeline carrying facts owned by several phases.

Stable semantic and portable identities derive from canonical declared inputs, never from object identity, allocation order, map iteration order, filesystem enumeration, absolute paths, or source-array accidents.

## 5. Semantic authority

`SemanticProgram` is the sole package-local authority for source-language meaning.
It owns every declaration, type, relation, selected member, selected signature, conversion, narrowing fact, capture, and call binding that later phases need for the complete target in `LANGUAGE-SURFACE.md`.
After it seals: syntax is no longer a semantic query surface; overload, member, symbol, and package searches are finished; every supported call has one exact target and signature; every supported value and storage use has an exact semantic type; unsupported, ambiguous, or contradictory constructs have explicit failures; and no later phase creates a source-language diagnostic for information that semantic analysis was responsible for establishing.

Typed IR and later phases consume stable identities and immutable facts.
They do not inspect arbitrary AST ancestry, search declarations by spelling, reopen dependency resolution, or reconstruct facts from emitted code.

`nameof` is a compiler-owned intrinsic under `LANGUAGE-SURFACE.md`: semantic analysis resolves and validates its operand, and lowering emits the constant string without a runtime call or framework dependency.

A grafted extension method under `ARCHITECTURE.md` section 4 is a member the augmenting package adds to the class.
Semantic analysis records the merged declaration as that member, and each unconditional module-level assignment of a function expression to `X.prototype.m` in the same package, where `X` is the class or one of its subclasses, as `X`'s implementation of it.
A call through the member dispatches on the receiver's class exactly as a call to a member the class declares itself, including when the class belongs to another package; dispatch is keyed by the class's identity, never by the member's name.
The assignment still runs at its place in module evaluation and still defines the prototype property, so the method stays observable, and a receiver whose class has no implementation throws the `TypeError` ECMAScript requires.
An assignment in any other form keeps its ordinary ECMAScript meaning and is never dropped.
A static member a package adds through declaration merging is the same fact without dispatch: its calls are direct.
The artifact records each added member as a public member augmentation under `ARTIFACT-CONTRACT.md`.
A grafted member is therefore never a statically bound helper: subclasses override it as they override any member, even when the member and the class come from different packages.

Missing compiler knowledge is never a runtime value.
No unresolved condition may be replaced with `Dynamic`, zero, `undefined`, an empty value, a first match, name-based dispatch, or a backend fallback.
A dynamic operation is valid only when the accepted language surface and the sealed semantic program explicitly require one.

## 6. Semantic type and representation

Source-language type and physical representation are separate authorities, as `VALUE-SEMANTICS.md` requires.
Semantic analysis establishes what a value means; portable representation planning establishes how that proved value, storage location, or boundary is carried by the portable execution contract; portable lowering consumes both.

Representation planning is target-independent: it contains no target triple, native register, PE, ELF, or Mach-O rule, operating-system library, native calling convention, or target address.
An optimization may refine a representation only when it preserves all accepted observable behavior and retains explicit transitions at every affected boundary; it never changes semantic identity or repairs missing semantic information.

## 7. Artifact and AOT boundaries

The source compiler publishes only the artifacts accepted by `ARTIFACT-CONTRACT.md`; every required consumer fact is in the primary artifact.

The AOT compiler begins only after portable artifacts exist:

```text
validated portable root and .ctxl closure
  + explicit target contract
  -> target representation and ABI planning
  -> target lowering and native code generation
  -> native linking and container emission
  -> target-native artifacts and native debug information
```

It may decide target layouts, calling conventions, instruction selection, registers, relocations, native sections, loader records, and native debug representation.
It may not decide TypeScript types, choose overloads, resolve source members, reinterpret package identity, or invent a missing portable operation.
Source-compiler packages and AOT packages are separated by the public portable artifact reader and schema: AOT packages cannot import syntax, binding, semantic-builder, typed-IR-builder, or other frontend packages.

## 8. Failure, determinism, and enforcement

Failures stop at their owning boundary: graph and dependency failures before package compilation; syntax and semantic failures before semantic sealing; incomplete or contradictory typed, representation, or portable programs at their phase verifier; serialization or validation failures before publication; and target incompatibility before native output.
No failing compilation publishes a primary artifact as usable, and temporary output cannot satisfy a dependency.

For identical declared inputs, every sealed phase result and emitted portable artifact is deterministic; `ARTIFACT-CONTRACT.md` lists the host and target facts that cannot alter portable output.

The architecture is enforced mechanically when implementation begins: package dependencies prevent backward or cross-phase imports; downstream APIs expose immutable phase outputs, not builders or resolvers; phase verifiers reject incomplete tables and unresolved identities; dependency-isolation tests remove producer source before compiling a consumer; direct and solution builds prove byte identity; cross-package tests exercise installed `.ctxl` artifacts; the AOT path records the exact portable identities it consumed; and instrumentation proves that emission and AOT perform no semantic queries, AST searches, dependency rediscovery, or implicit fallback.
These structural checks do not replace semantic, runtime, AOT, ABI, loader, or target witnesses.
