# Changelog

**Scope:** What each version of CONTEXT's `@noldova` packages holds, newest first.

Each version's section is written by the pull request that changes the version, from the pull requests merged since the previous version; other pull requests don't edit this file.
Every package moves to each version together, as [VERSIONING-AND-COMPATIBILITY.md](documents/VERSIONING-AND-COMPATIBILITY.md) says.
Versions before 0.0.6 are described in their version pull requests.

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
- `@noldova/context.parsers.typescript`: the source parser merges the top-level regions it parses again, such as top-level awaits, in one pass over all of them. It and `@noldova/context.parsers` and `@noldova/context.parsers.regex` prove the values they asserted non-null, with no change to what they parse or report (#115, #125, #126).
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
- `@noldova/context.data.sql.postgresql`: the connect and cancel limits run on the client's own `ClientTimers` instead of the global `setTimeout` (#105). Its twelve exceptions take their name from the base `Exception`, and each name is unchanged (#93).
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
