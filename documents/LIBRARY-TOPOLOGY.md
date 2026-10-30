# CONTEXT library topology

**Scope:** Framework-library ownership, package topology, global identities, extensions, support classification, and TypeScript declaration mapping

## 1. One source of truth

CONTEXT libraries are ordinary TypeScript projects compiled by the ordinary CONTEXT source compiler.
Their `.ctxl` artifacts contain executable code and all required public semantic metadata; type-only sources produce semantic metadata without invented runtime behavior.

Vendored declarations follow the conformance-only intake rules in `TYPESCRIPT-COMPATIBILITY.md`.
CONTEXT defines its own class-based library API while matching accepted TypeScript and ECMAScript observable behavior.

Keywords, primitive keyword types, syntax, binding rules, and language constructs remain compiler responsibilities.
Public identities such as `Array<T>`, `String`, `Promise`, and `Map` belong to library packages, and CONTEXT creates no public `Native*` parallel identity for them.
For a built-in global that TypeScript represents as an instance interface, a constructor interface, and one declared value, CONTEXT maps the runtime object to one concrete class; a constructor interface may describe the framework's call and construction projection, but APIs return the concrete class.
The compiler owns any associated primitive keyword type.

## 2. Core

`noldova.context.core` is the lowest ordinary library package.
It owns the public contracts and implementations of its foundational types: `Object`, `Function`, primitive wrappers, and property descriptors; `Array`, `ReadonlyArray`, `String`, `RegExp`, and their core identities; the concrete iterator and regular-expression result identities those APIs require; `IArguments` and other foundational call identities; the ECMAScript base `Error` hierarchy; and TypeScript's type-only utility types, which Core's own standard signatures use, as `Object.freeze` returns `Readonly<T>`.
Core owns the complete accepted standard behavior of every identity it owns and splits none across packages.
Behavior that belongs to or needs an identity a higher package owns is added by that package as an extension, as section 5 shows.
Separately accepted CONTEXT additions use the extension-method contract in `ARCHITECTURE.md`.

During the stage-zero bootstrap, Core augments host global identities with accepted CONTEXT additions, declares no class sharing a built-in global's name, and may add foundational value types of its own.
The accepted Core additions are the `Object` value checks `isBigInt`, `isBoolean`, `isFunction`, `isNull`, `isNullOrUndefined`, `isNumber`, `isObject`, `isString`, `isSymbol`, and `isUndefined`; `String.empty`, `String.format`, `String.isNullOrEmpty`, and `String.isNullOrWhitespace`; and the ASCII decimal-digit, hexadecimal-digit, and letter classifications.
Every bootstrap augmentation is recorded for re-analysis by its owning standard-library campaign.
A Core type that needs a host primitive declares the host contract as a typed ambient declaration rather than importing a host module.
Core temporarily hosts the `nameof` shim under `LANGUAGE-SURFACE.md`; that shim creates no dependency on a reflection package.

The framework projection of `String` remains callable: `String(value)` returns a primitive string, while `new String(value)` returns the concrete class.
The future Runtime owns callable, indexed-property, and prototype-observable projection; Core does not simulate them with a second source function or Node-specific property wiring.

Core does not own console, environment, process, threading, files, paths, networking, general collections, promises, typed memory, date and time, internationalization, reflection, JSON, URL, DOM, Worker APIs, compiler metadata, SDK tools, or operating-system services.
Package size never justifies moving an unrelated responsibility into Core.

## 3. Package responsibilities

| Package | Responsibility |
|---|---|
| `noldova.context.core` | Foundational global identities with their complete standard behavior, utility types, and base Errors |
| `noldova.context.exceptions` | Additional CONTEXT exceptions (`EXCEPTIONS-CONTRACT.md`) |
| `noldova.context.collections` | Collection algorithms, Map, Set, weak collections, readonly views, and collection iterators |
| `noldova.context.text` | Additional text abstractions, accepted String augmentations, and ECMAScript URI encoding functions |
| `noldova.context.json` | JSON parsing and serialization |

Experimental resource-management and Temporal surfaces extend these owners or belong to separately accepted packages.
ECMAScript years and TypeScript `lib.*.d.ts` filenames never become package identities.

## 4. Dependency direction

The accepted direct library dependencies are:

| Package | Direct library dependencies |
|---|---|
| Core | None |
| Exceptions | Core |
| Collections | Core |
| Text | Core, Exceptions, Collections |
| JSON | Core, Exceptions |

`PACKAGE-CONTRACT.md` owns graph validation and source-import permissions.
During partial stage-zero implementation, a package declares only the dependencies its implemented slice uses.

## 5. Identity and extension ownership

One package owns each public identity.
Another package may add cohesive behavior without becoming a second owner:

```text
Core owns String and its complete accepted standard behavior
  -> Text may add separately accepted CONTEXT behavior
```

An extension augments the owning identity's instance or constructor contract and its corresponding runtime prototype or value.
It never exposes a parallel public `StringExtensions`, `ObjectExtensions`, or equivalent identity.
Concrete result and iterator identities required by a Core-owned member remain in Core so the lowest package acquires no reverse dependency; higher package-specific adapters remain with their concrete owners.

Text owns `ReadOnlyStringSpan`, `StringBuilder`, the `LineTerminator` contract with its `EcmaScriptLineTerminator`, and `UnicodeCodePointService`; Collections owns `BinarySearchService`, which `UnicodeCodePointService` uses.
`UnicodeCodePointService` holds the Unicode 15.1 `ID_Start` and `ID_Continue` ranges from `DerivedCoreProperties.txt` (SHA-256 `f55d0db69123431a7317868725b1fcbf1eab6b265d756d1bd7f0f6d9f9ee108b`), and its test pins every code point's classification by a hash.
Their contracts are documented in the packages' public APIs.
Text's accepted `String` augmentations are the ASCII binary-digit and octal-digit classifications.
`appendLine` and every environment-selected newline remain deferred until the Environment and Runtime package boundaries are accepted and implemented.
Generic source mapping consumes an explicitly selected `LineTerminator`; lexical whitespace and line-break policy remain with each language parser.

## 6. Framework environments and campaigns

The stable portable environment composes the accepted stable packages.
Web and Worker environments are optional and share common Web packages rather than duplicating identities.
ESNext behavior is experimental until explicitly adopted into the stable environment.
Script Host is not an adopted Runtime environment; its vendored declarations remain conformance evidence.
Node APIs are not TypeScript built-ins and require a separate future framework or package decision.
The exact framework identities and the complete Web package topology remain deferred.

Implementation of a standard-library global begins with the complete surface inventory defined by `TYPESCRIPT-COMPATIBILITY.md`.
A campaign selects one public identity and its complete dependency closure; prerequisite identities may be implemented within it, and unrelated work does not replace or suspend it.
Every inventoried declaration, member, overload, augmentation, symbol member, deprecated member, and related type is assigned to its identity owner or extension owner and receives one machine-readable ledger classification:

| Classification | Contract |
|---|---|
| Required | Supported by every framework that includes its owner |
| Deprecated required | Still supported; deprecation metadata and replacement guidance are preserved |
| Optional framework | Supported only when its declared environment is referenced |
| Excluded environment | Not supplied by an adopted framework, with one explicit reason |
| Compatibility only | Vendored aggregator, alias, or empty placeholder with no CONTEXT runtime API |
| Temporarily unimplemented | Development failure; never an accepted exclusion or inapplicability reason |

Each ledger entry records its framework, type-only or runtime-bearing status, and expected result when its owning environment is absent.

CONTEXT additions are recorded separately and never satisfy an upstream entry.
The ledger also records each upstream interface or type alias mapped to a concrete class; a declaration-kind difference never hides an unimplemented member or observable difference.
A campaign remains in progress until every applicable upstream entry is implemented through every required layer and verified, every accepted exclusion has an objective framework reason, and the unaccounted count is zero.

Deprecation does not authorize removal, an extra compiler error, or behavior change under the pinned TypeScript surface.
The deprecated status required for semantic tooling is public `.ctxl` metadata; explanatory documentation and replacement prose may travel in `.ctxd`.
The compiler emits a diagnostic only when accepted TypeScript behavior requires one, and the language server presents the same fact from package metadata.
