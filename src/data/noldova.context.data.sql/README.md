# noldova.context.data.sql

The data model of `noldova.context.data` over SQL: a schema and migration
builder, dialects that render it with every identifier quoted, and SQL
connections, transactions, migrations and a change feed over one database
session a provider supplies. A connection runs its statements and
transactions one at a time; inside a transaction's action, every statement
goes through the transaction the action receives, never the connection,
whose calls would wait for the action to end.

`noldova.context.data.sql.sqlite` and `noldova.context.data.sql.postgresql`
provide the sessions and dialects of each database.

## Install

```bash
npm install @noldova/context.data.sql
```

## Use

```ts
import { type MigrationBuilder, SqlMigration, SqlQuery } from "@noldova/context.data.sql";

type Note = { readonly id: string; readonly text: string };

class NotesMigration extends SqlMigration {
  public constructor() {
    super("20260908130000_Notes");
  }

  public override apply(builder: MigrationBuilder): void {
    builder.createTable<Note>("notes",
      table => {
        table.addColumn(t => t.id, "TEXT");
        table.addColumn(t => t.text, "TEXT");
      },
      constraints => constraints.addPrimaryKey(t => t.id));
  }
}

await connection.runInTransactionAsync(async transaction => {
  await transaction.executeAsync(new SqlQuery("INSERT INTO \"notes\" (\"id\", \"text\") VALUES (?, ?)", ["1", "a"]));
});
```

A column's type is its provider's own, such as `TEXT` or `BIGINT`; the
dialect's `formatColumnType` spells the one each property type needs. A
context's model can be checked against the tables its migrations create,
which throws `SchemaMismatchException` naming the table and column that
differ:

```ts
import { SqlModelValidator } from "@noldova/context.data.sql";

SqlModelValidator.validate(context.model, migrations, context.database.connection.dialect);
```

The declaration file `api/index.d.ts` documents every member with its
contract.

## License

MIT; see `LICENSE`.
