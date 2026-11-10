# Changelog

**Scope:** What each version of CONTEXT's `@noldova` packages holds, newest first.

Each version's section is written by the pull request that changes the version, from the pull requests merged since the previous version; other pull requests don't edit this file.
Every package moves to each version together, as [VERSIONING-AND-COMPATIBILITY.md](documents/VERSIONING-AND-COMPATIBILITY.md) says.
Versions before 0.0.6 are described in their version pull requests.

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
