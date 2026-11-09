# noldova.context.data.sql.sqlite

The SQLite provider of `noldova.context.data.sql`, on the host's
`node:sqlite`: a connection opens a database file with write-ahead logging
and foreign keys on, creating its folder and the file when absent, and runs
its statements and transactions one at a time. Inside a transaction's
action, every statement goes through the transaction the action receives.

## Install

```bash
npm install @noldova/context.data.sql.sqlite
```

## Use

```ts
import { DbContextOptionsBuilder } from "@noldova/context.data";
import "@noldova/context.data.sql.sqlite";

await using context = new NotesContext(new DbContextOptionsBuilder().useSQLite("data/notes.db"));
await context.database.migrateAsync();
```

The declaration file `api/index.d.ts` documents every member with its
contract.

## License

MIT; see `LICENSE`.
