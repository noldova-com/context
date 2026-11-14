# Context architecture

**Scope:** The code rules only this repository has, on top of the organization's [standards](https://github.com/noldova-com/.github/blob/main/standards/AGENTS.md)

Noldova's [standards](https://github.com/noldova-com/.github/blob/main/standards/AGENTS.md) apply here in full.
This document holds only what is context's own; a rule here that is stricter than a standard says so.
`PACKAGE-CONTRACT.md` owns package identity, casing and layout, and `LIBRARY-TOPOLOGY.md` owns which library owns what.

## 1. Ownership during the bootstrap

During the stage-zero bootstrap, behavior that belongs to no package yet goes where its future owner will take it:
- if the host platform already provides it, use the host form and record the desired CONTEXT surface for its future owning campaign;
- if exactly one package needs it, it becomes a method of that package's owning concept;
- if the need is genuinely shared and the host lacks it, the owning library package gains it as a global augmentation of the host identity, never as an importable class sharing a built-in global's name, and the addition is recorded for its standard-library campaign.

Compiler-generated bootstrap support code is not a helper.

## 2. `nameof`

The compiler-owned `nameof` expression is a surface that may be a free function.
A statically known member identity passed to reflection, descriptor, metadata or registration code uses `nameof`; raw member-name strings are not used at those boundaries.
A `nameof` selector lambda names its parameter `t`, as in `nameof<Type>(t => t.member)`.
Names received dynamically remain dynamic.

## 3. Standard-library classes

An upstream TypeScript interface or type alias that represents a runtime object maps to a concrete CONTEXT class.
The framework or Runtime may add call or construction entry points to that class without a second source owner or JavaScript prototype wiring.

## 4. Extension methods

Type-grafted extension methods are the preferred way to add responsibility-specific behavior to an existing concrete type.
This is broader than the TypeScript standard, which confines declaration merging and prototype additions to one foundation package: here every package that owns an operation on a type extends it, such as a parser's node extensions, and that needs a maintainer's decision.
- The concrete class owns its state, invariants, identity and core lifecycle; an extension adds cohesive behavior without becoming a second owner of the class's state or facts.
- The package responsible for an operation owns its extension implementation; the extended concrete type provides the polymorphic dispatch surface.
- Declaration merging declares the method, and a direct, named prototype assignment implements it; grafting is never hidden behind a helper.
- Extensions operate on their explicit `this` and parameters.
  They consult no ambient mutable session, service locator or unrelated global state, add no fields or hidden storage, never use declaration merging as a state channel, and consume facts owned by the appropriate component or phase without rediscovering, replacing or inventing them.

Internal extension loading belongs to its owning extension entry point, such as a parser's `extensions/nodes/node.extensions.ts`, which imports the concrete node extensions and defines the base behavior.
`api/index.ts` doesn't enumerate internal registrations, and `api/index.d.ts` doesn't expose internal extension methods merely because they are extensions or tests call them.

Extension files are named `<extended-type>.extensions.ts`, or `<extended-type>-<responsibility>.extensions.ts` when one type has genuinely independent responsibilities.
They live beneath `extensions/`, with optional domain grouping, and their tests mirror the same path.

## 5. Parsers

On a parsing session's per-token path, positions and counts that its lexer and parser pass to the reader, to spans or to the diagnostic collector are documented caller obligations, not repeated checks.

A public parser accepts language input and returns its AST and diagnostics.
Callers do not assemble its private lexer state or grammar contexts; shared sources and bounded readers remain input contracts without exposing token navigation or internal contexts through public inheritance.

A named singular syntax child uses its semantic role plus `Node` (`expressionNode`, `semicolonNode`), and constructor parameters use the same names.
`CompositeNode` is reserved for genuine ordered semantic collections; a node with fixed named roles extends `Node` and stores them directly, and no property merely returns `children` under another name.

## 6. Files and folders

The `src/api/index.d.ts` catalog and test-local declarations under `TESTING-CONTRACT.md` are declaration mirrors, not source interfaces.
A package still using a manual `src/api/index.d.ts` mirrors every public interface and type alias there with an explicit `export declare` form; the catalog is never the only definition.
The manifest, `tsconfig.json` and `resources.ts` stay at the source root.

Package-name segments keep established product and acronym spellings, such as `TypeScript`, `IO` and `VM`.
A file name takes a final word after a dot when the type's name ends with a kind this repository groups in folders of that name: `node`, `parser`, `lexer`, `reader`, `validator`, `exception`, `service` and `fixture`, so `regex-term.parser.ts` defines `RegexTermParser`.

## 7. Values and text

Missing knowledge is never replaced with `Dynamic`.
Text's `StringBuilder` serves unbounded incremental string accumulation when the dependency direction permits; fixed or tightly bounded concatenation stays direct.
A lower package that can't depend on Text may use a local host string-chunk collection inside the owning operation and materialize it once, without a second public builder identity.

Values fixed by an external compatibility contract, such as TypeScript's own enums that context mirrors, keep that spelling inside the enum.
Upstream APIs and preserved conformance inputs are not renamed.

## 8. Comments and API documentation

Stricter than the code standard: until a package has a verified source-owned documentation generation path, JSDoc lives only in declaration files, and source, test and script code carry no comments.
The only comments in code are the license header, the Node-API note `TESTING-CONTRACT.md` requires, and a generated file's upstream attribution.

Until then, a package's `src/api/index.d.ts` is its sole public-documentation authority, and `BUILD-AND-VERIFICATION.md` owns declaration copying.
Each package's comments and generation migrate together; there are never two handwritten copies, stripped installed API docs, a temporary text or regex extractor, or a legacy compiler dependency.
The accepted destination is source-owned JSDoc for public and internal code, in the documentation-comment style of TypeScript's own source, beside the declarations it describes, including overload signatures and the consumer-facing declarations of extensions and augmentations, from which consumer declarations, IntelliSense documentation and reference pages are generated.

## 9. Scripts and tests

`BUILD-AND-VERIFICATION.md` owns bootstrap execution, `Script` inheritance, process boundaries and generated output.
Tests run through `noldova.context.testing` under `TESTING-CONTRACT.md`, with no outside framework or runner.
Test classes use the production type's name plus `Tests` (`HashTests`).
