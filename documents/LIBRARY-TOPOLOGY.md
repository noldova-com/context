# CONTEXT library topology

**Scope:** Framework-library ownership, package topology, global identities, extensions, support classification, TypeScript declaration mapping, and the data packages' host boundary

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
| `noldova.context.data` | The provider-independent data model: data sources, connections, transactions, migrations and their history, the change feed, and `DbContext` with its options (section 7) |
| `noldova.context.data.sql` | The SQL implementation of the data model: the schema model, the migration builder, the SQL dialect, and SQL connections, transactions, migration history and change feed |
| `noldova.context.data.sql.sqlite` | The SQLite provider: its dialect, its connection, and `useSQLite` |
| `noldova.context.data.sql.postgresql` | The PostgreSQL provider: its dialect, its connection, `usePostgreSQL`, and the PostgreSQL client it talks to its server through (section 7.5) |

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
| Data | Core, Exceptions |
| Data.Sql | Core, Exceptions, Data |
| Data.Sql.SQLite | Core, Exceptions, Data, Data.Sql |
| Data.Sql.PostgreSQL | Core, Exceptions, Data, Data.Sql |

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
Node APIs are not TypeScript built-ins and require a separate future framework or package decision; section 7 records the one package decision taken so far, the data providers'.
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

## 7. Data packages and their host boundary

The data packages are framework code: a portable data model, a SQL layer that stores it in tables, and one provider package for each database engine.

### 7.1 Portable model and host providers

Data and Data.Sql are portable: they import no host module and perform no I/O.
Everything that reaches a database is an abstract member a provider implements: a connection's open, close and statements, a transaction's commit and rollback, and the dialect's SQL forms.

A provider package is the only place a database engine or the network is reached.
During the Node bootstrap, the SQLite provider uses `node:sqlite`, `node:fs` and `node:path`, and the PostgreSQL provider reaches its server only through `node:net` and `node:tls`, with `node:crypto` for its SCRAM-SHA-256 sign-in, behind the same host boundary as `node:sqlite`.
Each file that imports one of them carries the Node note in `TESTING-CONTRACT.md` section 1.
When the Runtime owns files and networking, each provider moves onto the Runtime's contracts, and neither the portable packages nor a provider's public API changes for it.

No provider belongs to a framework composition: an application takes the one it uses as an ordinary package dependency, and a portable package never depends on a provider.
No CONTEXT package depends on a third-party package: the PostgreSQL client is CONTEXT's own code, as section 7.5 says.

### 7.2 Asynchronous operations

A network database can't answer synchronously, so every data operation that reaches a database is asynchronous, on SQLite too, so that an application's code is the same on both engines.
Executing, inserting and querying, beginning, committing and rolling back a transaction, migrating, closing, and appending to and reading the change feed each return a `Promise` and take the `Async` suffix.
Opening a connection stays synchronous and never waits on a network, so a context still opens its database in its constructor: SQLite opens its file, creating its folder, when the connection opens, and PostgreSQL connects on the connection's first operation.
Connections, transactions and contexts implement `AsyncDisposable`, so a caller writes `await using`.
The SQLite provider settles each promise from `node:sqlite`'s synchronous call, so its results and their order are those of the synchronous calls.
Building a schema, a migration or a query does no I/O and stays synchronous.

A connection is one session whose operations take turns.
A transaction holds the connection from its start until it commits or rolls back, and any operation started meanwhile, from any caller, statements and other transactions alike, waits for its turn, so two callers never share a transaction.
Inside a transaction's action, everything goes through the transaction the action receives: its statements, a nested transaction through its `runInTransactionAsync`, which joins it, and the change feed, given the transaction.
Never call the connection inside an action: that call waits for a turn that comes only after the action ends, so it never settles.
The portable packages can't tell an action's own calls from another caller's without a host's asynchronous context, so the transaction is passed explicitly.

### 7.3 Dialects

The SQL in Data.Sql, its own tables' included, is written once and rendered through the dialect, which owns every form the two engines spell differently:
- an identifier: quoted with double quotes, which both engines accept, so a mixed-case name such as `entityId` keeps its case in PostgreSQL;
- a column type: an integer is SQLite's `INTEGER` and PostgreSQL's `BIGINT`, and text is `TEXT` in both;
- a generated key: SQLite's `INTEGER PRIMARY KEY AUTOINCREMENT` and PostgreSQL's `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`;
- a transaction's begin: SQLite's `BEGIN IMMEDIATE`, which takes the file's write lock at once, and PostgreSQL's `BEGIN`;
- a lock until the transaction ends: none in SQLite, whose transactions already hold the write lock from their begin, and PostgreSQL's `pg_advisory_xact_lock`.

The rest belongs to the provider's session, which runs the statements:
- a parameter: every query writes `?`, which SQLite takes as it is, and the PostgreSQL session rewrites to `$1`, `$2`, so the queries of an application stay the same on both;
- an insert's new key: SQLite's last-row identifier, and PostgreSQL's `lastval()`, read in the same session right after the insert.

The PostgreSQL rewrite scans the statement as the server's lexer does: it leaves `?` alone inside quoted text (`'…'`, `E'…'` with its backslash escapes), quoted identifiers, dollar-quoted text (`$$…$$` and `$tag$…$tag$`), and `--` and `/* */` comments, nested ones included.
It refuses with `DataException`, rather than guess, PostgreSQL's own operators spelled with a question mark: `?|` and `?&`, any `?` joined to another operator character (such as the geometric `?-` and `?#`), and `?` used as the `jsonb` operator, which it tells from a parameter by what comes before it: a parameter follows an operator, a comma, an opening parenthesis or a keyword, and an operator follows an operand, such as a column name, a literal or a closing parenthesis.
It also refuses a statement whose count of placeholders differs from its count of parameters.
An application that needs those operators calls their functions instead, such as `jsonb_exists`.

Both insert keys read the last key the session generated, so they assume that the insert fires no trigger that inserts into another table with a generated key; the framework's own tables have no triggers.

A value read from a database is text, a number, or null, in both providers.
The PostgreSQL provider reads a `BIGINT` as a number when it is a safe integer and throws `DataException` otherwise, as the SQLite provider throws for a value of another kind.

### 7.4 Connections, migrations and the change feed

A SQL connection runs its statements on one session a provider supplies, and its transactions over the same session. A PostgreSQL connection holds one server session for its whole life, reserved from the client's pool, so a transaction and the order of its statements behave as on one SQLite file handle; the data source's location is the server's connection string, which the provider never writes into a message, an exception or a log.
Migrating takes a lock first, so that several processes starting at once apply each migration once: SQLite's write lock on its file, which `BEGIN IMMEDIATE` takes and a busy timeout of five seconds waits for, and PostgreSQL's transaction-scoped advisory lock.
Appending to the change feed, and reading it, take the same kind of lock until the transaction ends, so the feed's sequence numbers become visible in order and a reader of the changes after a sequence never skips one that commits later.
Reading the migration history takes the migration lock too, and both create their table under their lock, in a transaction, since two PostgreSQL sessions running `CREATE TABLE IF NOT EXISTS` for the same table at once can both try to create it, and one then fails.

### 7.5 The PostgreSQL client

The PostgreSQL provider's client is a port of postgres.js (`porsager/postgres`) at its `v4.1.0` tag, commit `d84da749342240a4c1fb44e4f9a6b22d2350fb7b`, rewritten in CONTEXT's style: classes, `Resources`, the package's exceptions, and the code rules in `ARCHITECTURE.md`.
postgres.js is under the Unlicense and has no dependencies, so the port owes no notice; the package's README names the source, its tag and commit, and what changed from it.

The port keeps, from `src/`, the connection, the pool, the entry point's options and client, the type conversions, the sign-in with SCRAM-SHA-256 and TLS, the protocol messages, queries with their cursors and COPY streams, the socket, errors, and results.
It leaves out `subscribe.js` (logical replication), `large.js` (large objects), `cf.js` (Cloudflare sockets), `diagnostics.js` (the diagnostics channels), and `build.js` (the tagged-template query builder), since Data.Sql renders every statement as text with parameters, and the password file.
It reads the TLS certificate options, `sslrootcert`, `sslcert`, `sslkey` and `sslpassword`, from the files the connection string names.
The client is internal to the package: the provider's connection is its only user, and the package's public API is the provider's.
