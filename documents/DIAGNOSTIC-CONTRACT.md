# CONTEXT diagnostic contract

**Scope:** Diagnostic models, code authorities, locations, message structure, producer ownership, collection, ordering, presentation, and conformance comparison

## 1. Ownership

`noldova.context.diagnostics` owns the concrete immutable diagnostic models and their invariants, and nothing else: no diagnostic definitions, formatter, shared collection or builder class, or package-specific exception types.
Diagnostic-model validation failures throw `ArgumentException`.
The package depends only on accepted lower foundational packages, never on a parser, syntax node, compiler phase, package resolver, Runtime, SDK, filesystem, console, Microsoft TypeScript implementation, or host operating system.

Each producer owns the catalog for its responsibility: the TypeScript frontend owns TypeScript templates; package and solution tooling owns package-graph and manifest templates; artifact readers and writers own artifact templates; Runtime, SDK, and AOT components own theirs.
There is no global `Diagnostics`, `CommonDiagnostics`, helper, or mutable registry acting as an ownerless catalog.
A producer consumes the shared model and publishes diagnostics through its own sealed result.

## 2. Model

```text
DiagnosticTemplate
  -> zero or more default DiagnosticTag
  -> creates Diagnostic
       -> DiagnosticCode
       -> DiagnosticAuthority
       -> DiagnosticCategory
       -> DiagnosticMessage
       -> optional DiagnosticLocation
       -> zero or more DiagnosticRelatedInformation
       -> zero or more DiagnosticTag
```

- `DiagnosticTemplate` is one reusable, immutable definition owned by a producer catalog, including tags that apply to every occurrence.
  Templates use the upstream `{0}` placeholder convention with string and number arguments; producer catalogs and their generators validate placeholders.
  Shared runtime templates neither parse nor cache placeholder structure; diagnostic creation uses Core's `String.format`.
- `DiagnosticAuthority` is one canonical code namespace and owns its display prefix; the prefix is not the authority.
- `DiagnosticMessage` preserves canonical text and nested message-chain structure; each node carries its code, category, text, and ordered children, and a `Diagnostic` derives its code and category from its primary node.

The package's `src/api/index.d.ts` documents the public types and members.

Model construction and operation results follow Noldova's [code standard](https://github.com/noldova-com/.github/blob/main/standards/CODE.md).

## 3. Authorities, codes, and categories

| Authority | Display form | Contract |
|---|---|---|
| TypeScript | `TS` plus the exact TypeScript number, such as `TS2304` | Code, category, message, location, related information, tags, and order match the pinned TypeScript reference where applicable. |
| CONTEXT | `CTX` plus the registered number, such as `CTX1001` | Globally unique within the ecosystem and owned by one named producer. |

A CONTEXT component must not allocate a TypeScript code for a different condition, and a CONTEXT capability or implementation failure must not masquerade as a TypeScript diagnostic.

CONTEXT producers receive exclusive blocks of 1,000 codes from this central registry; a producer that exhausts its block receives another block rather than extending into a neighbor.
A catalog verifies that every code is unique and inside its block.

| Producer package | Inclusive range |
|---|---|
| `noldova.context.parsers.regex` | `CTX1000` through `CTX1999` |
| `noldova.context.parsers.typescript` | `CTX2000` through `CTX2999` |

The categories are exactly Error, Warning, Suggestion, and Message.
Category is part of identity: no formatter, flag, consumer, or later phase rewrites it, and source compatibility profiles under `LANGUAGE-SURFACE.md` do not authorize warnings-as-errors.
An Error prevents publication of the product owned by the failing operation; Warning, Suggestion, and Message do not independently authorize publication.

## 4. Templates and creation

A template creates a new complete occurrence: code, authority, category, canonical message definition, and default tags come from the template; formatting runs exactly once; the occurrence contains its complete span and any supplied source identity; related information and tags are complete at creation; and no consumer attaches, repairs, or replaces fields afterward.

## 5. Messages, chains, related information, and tags

Canonical message text is structured data in the canonical English text of the accepted authority.
A future localized display may translate presentation but cannot alter the canonical record used for parity, baselines, machine consumers, or certification.

Every chain node preserves its exact code authority and number where the reference supplies them, category, canonical text, child order, and children.
Flattening a chain into one string is permitted only for presentation.
Related information is preserved independently and is neither appended to the primary message nor discarded when a formatter does not display it.
Tags are structured and ordered deterministically: a template's default tags precede occurrence tags, a duplicate across either sequence is invalid, and a tag is never inferred from message wording.

## 6. Location and source identity

A location contains an optional canonical logical source identity, a non-negative start, and a non-negative length, both in UTF-16 code units.
The span is half-open, zero-length spans including end-of-file are valid, and construction verifies the span against the source length when supplied.

The owner of the validated input supplies a source identity when the source has one; anonymous string input retains its span without an identity.
CONTEXT never fabricates an identity or reconstructs one from a syntax node, working directory, nearby checkout, or absolute host path, and project relocation cannot change an authoritative identity.
Line and character coordinates are derived from the exact source snapshot for presentation; they are not stored beside start and length as a competing authority, and they are zero-based internally unless a presentation format states otherwise.

A diagnostic may have no location when the condition is global or belongs to a non-text operation.
Artifact names, package identities, targets, and other non-text context belong in modeled message arguments or a future accepted resource-location contract, not in a fabricated source identity.

## 7. Producer ownership

The component with authoritative knowledge of a condition produces the diagnostic; consumers do not rediscover it or create a second diagnostic for the same fact.
For source compilation: dependency intake owns dependency and imported-contract failures; syntax owns lexical and syntactic TypeScript diagnostics; semantic analysis owns binding, typing, inference, narrowing, assignability, control-flow, and other source-semantic diagnostics; typed IR, representation planning, lowering, and emission create no TypeScript source diagnostic for facts earlier phases were required to establish; and AOT owns target validation and native-production diagnostics, never TypeScript meaning.

A TypeScript diagnostic belongs to the phase whose counterpart in the reference reports it.
Syntax owns what the reference's scanner and parser report.
Semantic analysis owns what its binder and checker report, including the grammar checks that read only what is written: the reference reports those from its checking walk, so whether one appears depends on what that walk visits, what an earlier check of the same node reported, and what the binder merged, which only an analysis performing that walk reproduces exactly.
Until semantic analysis exists, syntax also reports the binder and checker checks it already makes, its legality diagnostics, whose publication `COMPILER-ARCHITECTURE.md` owns.
They take on no further binder or checker diagnostic, and semantic analysis takes them over with their tests; a counterexample to them is recorded for semantic analysis rather than repaired in syntax, the exception `TESTING-CONTRACT.md` section 7 names.
Within them syntax never approximates a name resolved, a value computed, or a type compared, and reports nothing rather than a guess.
`noldova.context.compilers.typescript` is semantic analysis's intended home, and naming a package here settles no package boundary, which `PACKAGE-CONTRACT.md` and `LIBRARY-TOPOLOGY.md` own.

A regular expression written inside TypeScript source is parsed by `noldova.context.parsers.regex`, which has the authoritative knowledge of it and therefore produces the diagnostic.
The TypeScript frontend publishes that diagnostic unchanged, in the Regex producer's own CONTEXT codes, and does not restate it in TypeScript numbering.
The reference's regular expression analyzer publishes TS1499 through TS1538, which the TypeScript parser package never claims; where that analyzer reuses a code the TypeScript scanner also raises, such as an escape-sequence code, the two are not comparable, and a parity result records the case as a stated difference rather than a failure without excluding any diagnostic by its position.
Section 13's field-by-field comparison applies to the TypeScript diagnostics around it.
The same holds where the reference decides a diagnostic by what a name resolves to or what type something has, under a code the legality diagnostics also report: a private name accessed on an object is TS18016 or TS2339 by the object's type, an index signature parameter typed through an alias is TS1021 or TS1268 by what the alias names, an object literal member named by a computed expression repeats another under TS1117 by what the expression's type names, and an operand of `++`, `--`, or `for...in` that is no reference is TS2357 or TS2406 only where the reference accepts its type first.
The comparison selects the diagnostics it compares by code, so where the reference's parser and its checker report one code, the checker's occurrences are compared as well: TS1453 is the parser's for a reference directive and the checker's for an import attribute.
A parity result records a case that differs only in such occurrences as the checker's rather than as a failure.

Syntax also departs from the reference where the reference's result is an artifact of its Go implementation rather than a TypeScript rule.
Its scanner and its directive look-back test some characters one UTF-8 byte at a time, so they miss U+2028 and U+2029, which ECMAScript defines as line terminators, and its scanner accepts a merge-conflict marker two bytes into a line.
In CONTEXT, U+2028 and U+2029 end a regular expression body and a line, a line holding nothing before one of them is blank to the directive look-back, and a merge-conflict marker is recognized only where a line starts.
The reference also caps the number TS1121 suggests for a legacy octal literal at the largest 64-bit integer, names punctuation in TS2427, TS2457, and TS2819 by the word before it, and places a suggested space by map order, which changes from run to run; CONTEXT suggests the literal's own digits, names the punctuation itself, and places the space after the first keyword, in alphabetical order, that begins the word.
A parity result records such a case as a stated difference.

A later phase may report a distinct CONTEXT failure that belongs exclusively to its boundary, such as malformed sealed input or target incompatibility.
It may not translate missing semantic knowledge into a TypeScript-looking diagnostic, guess a source condition, or continue with a fallback artifact.
During incomplete implementation, a known missing capability may be reported as a clearly identified CONTEXT failure only when an accepted development contract permits it.
That result remains a failed conformance case, never an inapplicability reason.

## 8. Collection and order

A producer may use a private mutable sequence builder while it owns its phase; the builder is never shared or published.
Publication seals an immutable sequence that preserves every occurrence, including identical repeats, exact related-information and chain order, and deterministic primary order.
No generic set, code-and-line key, deduplication pass, map enumeration, filesystem order, or concurrency completion order determines the result; deduplication is permitted only when the authoritative language or operation defines it and the observable result is preserved.
When one operation merges several producer sequences, its contract defines a stable merge order by stage and canonical input order; parallel work may not alter it.
For TypeScript conformance a sequence is compared as the pinned reference's command line publishes it: its publication rule sorts and deduplicates, and `TYPESCRIPT-COMPATIBILITY.md` section 4 applies that rule to both sides.
The reference orders diagnostics that share a code and span by their message arguments and merges the related information of their repeats; CONTEXT publishes them in the order `COMPILER-ARCHITECTURE.md` section 3 gives, and a diagnostic retains no message arguments to reproduce the reference's.

## 9. Suppression and filtering

The shared package interprets no source directives, compiler options, manifest policy, or user-interface filters.
The TypeScript frontend owns `@ts-ignore`, `@ts-expect-error`, and their unused-directive diagnostics; suppression happens at the language-defined owner before the frontend result seals and never deletes records from a sealed sequence.
Future source compatibility settings belong to the frontend's accepted checking profile, never to display filters.
Display filtering may hide a category from one presentation without altering the authoritative result, ordering, conformance comparison, or publication decision.

## 10. Diagnostics, failures, and exceptions

A diagnostic reports an expected invalid input, unsupported external capability, or other modeled operation failure.
Invalid source, manifest, dependency, artifact, target, or command input produces the diagnostic owned by that validating boundary.
A compiler bug, impossible state, violated seal, corrupt private data, crash, timeout, or resource exhaustion is an internal failure reported by the owning workflow, never converted into a misleading user diagnostic to keep execution moving.
A malformed untrusted portable artifact is an input-validation failure with a public diagnostic; corruption created inside the same operation is an internal invariant failure.
Original causes are preserved when a boundary translates a lower-level failure, without duplicating the condition at every layer.

An explicitly accepted parser implementation limit checked before exhausting host resources is a modeled CONTEXT failure.
It follows the interrupted-result contract owned by `COMPILER-ARCHITECTURE.md`, never a TypeScript source-error code or a conversion of an unexpected host failure into recovered syntax.

## 11. Results and transport

Each operation returns its own concrete result class carrying its product and its diagnostics; there is no generic `Result<T>`, compiler session, service locator, or ambient collection.
Diagnostics are operation evidence, not executable artifact content: a `.ctx` or `.ctxl` consumer never needs producer diagnostics, and any diagnostic evidence later stored in `.ctxd` or an evidence bundle is optional developer information.

## 12. Presentation and machine representation

The structured diagnostic is authoritative.
A text formatter may produce canonical plain text from the model and a source snapshot; SDK tooling owns console layout, colors, hyperlinks, and verbosity; a conformance reporter owns comparison presentation; a machine writer owns an internal-version-1 structured representation when a public format is accepted.
`Diagnostic.toString()` is never a machine protocol or conformance oracle, and consumers never parse human-readable output.
A machine representation preserves every authoritative field without host-dependent paths, locale-dependent text, map order, or omitted duplicates.

## 13. TypeScript catalog and conformance

The TypeScript catalog is generated mechanically from the exact pinned TypeScript 7 reference data, never retyped, inferred from baselines, or copied from frozen output.
Vendored inputs remain unmodified; generated code follows the organization's code standard and `ARCHITECTURE.md` and retains upstream attribution.
Generation and verification fail on a missing or duplicate TypeScript code; a changed category, template, placeholder contract, or chain record; an unaccounted upstream definition; a CONTEXT code collision; or non-deterministic output.

The conformance harness compares structured results field by field, preserving counts and multiplicity: exact code, category, optional source identity, start, length, message text, nested chain, related information, tags, and order, in what the reference's publication rule publishes (section 8).
A set of `line:code` pairs, a flattened message, or a partial percentage is investigative evidence only.
`LANGUAGE-SURFACE.md` owns applicability and the exit criterion; `TYPESCRIPT-COMPATIBILITY.md` owns the pin, intake, and reference invocation.
A parity result identifies its exact profile.
