# Changelog

**Scope:** What each version of CONTEXT's `@noldova` packages holds, newest first.

Each version's section is written by the pull request that changes the version, from the pull requests merged since the previous version; other pull requests don't edit this file.
Every package moves to each version together, as [VERSIONING-AND-COMPATIBILITY.md](documents/VERSIONING-AND-COMPATIBILITY.md) says.
Versions before 0.0.6 are described in their version pull requests.

## 0.0.12

Every CONTEXT package is published again at one version, including the seven that 0.0.11's release left out.

- `@noldova/context.query` and `@noldova/context.query.expressions` reach npm for the first time, with what 0.0.11 describes (#197, #193).
- `@noldova/context.parsers`, `@noldova/context.parsers.regex`, `@noldova/context.parsers.typescript`, `@noldova/context.testing` and `@noldova/context.text` reach npm at this version; npm had them at 0.0.10, since 0.0.11's release stopped at the first package npm didn't have yet (#206).
- No package's source changes from 0.0.11.

## 0.0.11

CONTEXT gets collections and queries: a collections library, expression trees for queries and the queries built on them, and its PostgreSQL provider, migrations, core and test runner get fixes.

- `@noldova/context.query` (new): `Queryable<T>` builds a query as an expression tree with `where`, `select`, `orderBy`, `orderByDescending`, `thenBy`, `thenByDescending`, `skip` and `take`, and runs it only when a result is asked for, through `toArrayAsync`, `firstAsync`, `firstOrDefaultAsync`, `singleAsync`, `singleOrDefaultAsync`, `anyAsync`, `countAsync` or `for await`; `QueryProvider` is the contract a provider implements, and `InMemoryQueryProvider` runs a query over an `Enumerable` (#197).
- `@noldova/context.query.expressions` (new): immutable expression trees that describe a query's code as data, built with `Expression.constant`, `parameter`, `member`, `unary`, `binary`, `conditional`, `call`, `object`, `property` and `lambda`; `toString` writes an expression as TypeScript source, and `replace` puts one expression in place of another throughout a tree (#193).
- `@noldova/context.collections`: `Enumerable.from(iterable)` gives any iterable the query operators, and `List`, `Dictionary`, `HashSet`, `Queue` and `Stack` are enumerables with read-only views; `IEqualityComparer`, `DefaultEqualityComparer`, `EqualityComparers.by`, `Comparer.compare` and `KeyValuePair` compare and pair their elements; the package now takes `@noldova/context.core` and `@noldova/context.exceptions` as peers (#191).
- `@noldova/context.exceptions`: `InvalidOperationException`, `KeyNotFoundException` and two `ArgumentOutOfRangeException` guards, which the collections throw (#191).
- `@noldova/context.data.sql.postgresql`:
  - a connection closes when the server sends a message whose fields, lengths, terminators or array elements pass its end or don't match its columns, and each query waiting on it fails with a `ConnectionClosedException` whose `cause` is the new `MalformedMessageException`; a malformed message while the session starts fails the start with `MalformedMessageException` (GHSA-h83m-787c-32mg);
  - a pool keeps the keys it derives for SCRAM-SHA-256 sign-in to itself and forgets them once it ends, in place of one cache for the whole process (#202).
- `@noldova/context.data.sql`: `createUniqueIndex` names its index `UX_<table>_<columns>`, so it no longer shares a name with a plain index on the same columns, and a migration whose builder would create two indexes of the same name throws `InvalidOperationException` before anything runs (#196).
- `@noldova/context.core`: `String.isNullOrWhitespace` no longer builds a trimmed copy of the string, with the same results (#200).
- `@noldova/context.testing`:
  - `CONTEXT_TEST_STOP_LIMIT_MILLISECONDS` sets how long the runner waits for a stopped worker, for the runner's own tests; it keeps 5000 ms when unset (#181);
  - the source-map decoder's VLQ constants, `Resources.sourceMapBase64Alphabet`, `sourceMapValueMask` and `sourceMapContinuationBit`, are private constants of `SourceMap`, with no change in behavior (#198).
- No other package's source changes.

## 0.0.10

CONTEXT's text package orders strings by Unicode code point, and its data packages, PostgreSQL provider and test runner get fixes.

- `@noldova/context.text`:
  - `CodePointComparer.compare(left, right)` orders two strings by Unicode code point, a surrogate pair counting as the one code point it encodes, which is the order of their UTF-8 bytes on every locale and host; it returns -1, 0 or 1, so `names.sort(CodePointComparer.compare)` works, and a lone surrogate sorts by its own value (#175);
  - `EcmaScriptLineTerminator`'s example says that an empty string is no line terminator, which is what `isLineTerminator` returns (#169).
- `@noldova/context.data` and `@noldova/context.data.sql`: when an action swallows a nested action's failure, the transaction's `DataException` gives the first such failure as its `cause` (#170).
- `@noldova/context.data`: `DatabaseFacade`'s constructor closes the connection it opened when the provider's migrator or change-feed factory throws, and rethrows the provider's error (#171).
- `@noldova/context.data.sql.postgresql`: once the server ends a connection's session, as a restart, a dropped network, `idle_session_timeout` or `pg_terminate_backend` do, the connection's next operation outside a transaction reserves a new session, and an insert reads its key on the session that ran the insert; inside a transaction, its statements keep failing until it ends (#173).
- `@noldova/context.testing`: a worker that doesn't end within 5000 ms of being stopped is left behind and the run goes on; once the summary and results file are written, the command-line run fails, names each test whose worker was left behind, ends the processes still running under the run, and ends its own process only when that worker still hasn't ended (#156).
- No other package's source changes.

## 0.0.9

CONTEXT's packages take their siblings as peers in a range, its text package decodes octal escapes, and its test runner, data packages, JSON reader and TypeScript parser get fixes.

- Every package: its CONTEXT siblings are peers at `>=0.0.9 <0.1.0` in place of exact dependencies, so one copy of each serves an app whose packages need different versions in that range (#110).
- `@noldova/context.core`: a second copy refuses to load, with an error that names `npm ls @noldova/context.core`, in place of a `TypeError` (#110).
- `@noldova/context.text`: `OctalEscapeService.decode(text)` turns each three-digit octal escape, `\000` to `\377`, into the single character with that code, and leaves other backslashes alone (#162).
- `@noldova/context.testing`:
  - a run fails when a test's promise rejects after the test ended, with a `TestingException` that names the test (#157);
  - test files run in the order of their `/`-separated relative paths, the same on every system (#158);
  - the timing check's stale line says a list measured on several machines drops a file only once it is stale on every one of them (#114);
  - the reporter and coverage analyzer prove values they asserted non-null, with no change to what they report (#115, #125).
- `@noldova/context.data` and `@noldova/context.data.sql`: a statement that fails in a transaction marks it rollback-only, so the connection rolls it back and rejects with `DataException` even when the action caught the failure (#159).
- `@noldova/context.data.sql.postgresql`:
  - a query that a cancel sent for an earlier query stopped runs once more where the connection can retry it, and otherwise fails with a message that says so (#160);
  - SCRAM sign-in refuses a server's iteration count above 1,000,000, derives the key off the event loop so the connection's timeouts keep running, and connections that sign in with the same password, salt and count share one running derivation.
- `@noldova/context.json`: `JsonReader` converts a value reached through several references once, and the result shares it wherever the source does.
- `@noldova/context.parsers.typescript`: the source parser merges the top-level regions it parses again, such as top-level awaits, in one pass over all of them.
  It and `@noldova/context.parsers` and `@noldova/context.parsers.regex` prove the values they asserted non-null, with no change to what they parse or report (#115, #125, #126).
- No other package's source changes.

## 0.0.8

CONTEXT's test runner takes its hang limit from the suite, writes each test's time to a file, and judges test files' times for a timing check kept apart from the suite.

- `@noldova/context.testing`:
  - a command-line run takes its limit from `CONTEXT_TEST_TIMEOUT_MILLISECONDS`, 30 seconds when it's unset, and fails before a test starts on any value but a positive integer within the timer limit less the main thread's grace (#105);
  - with `CONTEXT_TEST_RESULTS_FILE` set, the run writes each test's identity, outcome and duration there as JSON once its tests end (#105);
  - a timed-out test's message gives its limit, "The test did not settle within its limit of 30000 milliseconds." (#105);
  - new classes for a timing check (#105):
    - `TestTimeRecord` reads and writes that file and formats the slowest tests;
    - `TestTimingCheck` judges test files by the median of their times over several runs, against a budget or a time the suite lists, plus a margin, and reads that list from a README;
    - `TestFileTiming` is one file's result, over its limit or listed but within the budget;
  - discovery throws a `TestingException` for a member a class lists without a property descriptor, and a test worker refuses to start without a parent port (#98).
- `@noldova/context.data.sql.postgresql`: the connect and cancel limits run on the client's own `ClientTimers` instead of the global `setTimeout` (#105).
  Its twelve exceptions take their name from the base `Exception`, and each name is unchanged (#93).
- `@noldova/context.data`: `DataException` takes its name from the base `Exception`, and its declaration no longer lists `name`; the name is unchanged (#93).
- `@noldova/context.parsers` and `@noldova/context.parsers.typescript`: the parsers prove the values they asserted non-null, through their types and by splitting flag-keyed methods in two, with no change to what they parse or report (#97, #98, #99, #101).
- `@noldova/context.text`: its README names the Unicode data its identifier tables come from, with the file's SHA-256 (#95).
- No other package's source changes.

## 0.0.7

CONTEXT gets helpers for reading JSON of any shape, and its PostgreSQL provider loads without creating the process's standard streams.

- `@noldova/context.core`: `Object.isPlainObject(value)`, true for an object whose prototype is `Object.prototype` or null, and false for anything else, including an object literal from another realm and a proxy whose prototype can't be read (#83).
- `@noldova/context.json`: `JsonReader.parseValue(text, path?)`, which parses a value of any root, and `readNumberArray(name)` (#83).
- `@noldova/context.data.sql.postgresql`: loading the package no longer makes Node create `process.stdin`, `stdout` and `stderr` (#81); its README says how a cancel behaves, including that PostgreSQL ignores one that arrives between statements (#85).
- No other package's source changes.

## 0.0.6

CONTEXT gets its data packages: a provider-independent data model, its SQL implementation, and SQLite and PostgreSQL providers.

- `@noldova/context.data` (new): data sources, connections, transactions, migrations and their history, the change feed, and `DbContext` with its options (#59).
- `@noldova/context.data.sql` (new): the SQL implementation of that model, with the schema model, the migration builder, the SQL dialect, and SQL connections, transactions, migration history and the change feed (#59).
- `@noldova/context.data.sql.sqlite` (new): the SQLite provider, over the host's SQLite engine (#59).
- `@noldova/context.data.sql.postgresql` (new): the PostgreSQL dialect, CONTEXT's own PostgreSQL client with its protocol, connection pool, types and TLS (#59), and the PostgreSQL provider (#60):
  - `PostgreSQLProvider`, and `usePostgreSQL(location)` on `DbContextOptionsBuilder`, which names the data source after the connection string's database;
  - one reserved client connection per session, with `?` parameters written as `$1`, `$2`, and an insert's key read with `lastval()`.
- `@noldova/context.testing`: a test run fails when a test thread that the run listed as ended by itself wrote no coverage report, since its coverage would be incomplete (#59).
- No other package's source changes.
