# noldova.context.data

The database-independent data model a provider implements: a `DbContext`
opened from options, its connection and transactions, the migrations it
applies in id order, and a change feed that records every mutation in
sequence. Every operation that reaches the database returns a promise;
connections, transactions and contexts are disposed with `await using`.
A connection runs one transaction at a time; inside a transaction's action,
everything goes through the transaction the action receives, never the
connection, whose calls would wait for the action to end.

`noldova.context.data.sql` implements the model over SQL, and its SQLite and
PostgreSQL providers over each database.

## Install

```bash
npm install @noldova/context.data
```

## Use

```ts
import { ChangeOperation } from "@noldova/context.data";

await using context = new NotesContext(options);
await context.database.migrateAsync();
await context.database.connection.runInTransactionAsync(async transaction => {
  await context.database.changeFeed.appendAsync("note", "1", ChangeOperation.Insert, "{}", transaction);
});
const changes = await context.database.changeFeed.readAfterAsync(0);
```

The declaration file `api/index.d.ts` documents every member with its
contract.

## License

MIT; see `LICENSE`.
