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
dialect's `formatColumnType` spells the one each property type needs.
A migration also changes existing tables: it drops a table, adds, drops or
alters a column, and changes a table's primary key and foreign keys. A
required column added to a table with rows takes a default value, or a
default written as SQL with `hasDefaultValueSql`:

```ts
builder.addColumn("notes", "rank", "BIGINT").hasDefaultValue(0);
builder.addColumn("notes", "created", "TEXT").hasDefaultValueSql("CURRENT_TIMESTAMP");
builder.alterColumn("notes", "text", "TEXT").makeNullable();
builder.dropPrimaryKey("notes");
builder.addPrimaryKey("notes", "id", "rank");
builder.addForeignKey("notes", "ownerId", "owners", "id");
```

A column made `NOT NULL` with a default takes that default in each row that
holds `NULL`; without one, such a row fails the migration. A column whose
type changes takes the default given, which PostgreSQL sets after dropping
the old one, so a default of the old type doesn't fail. A dialect names
keys `PK_<table>` and foreign keys `FK_<table>_<column>`.
PostgreSQL alters a table in place. SQLite can't alter a column, so it
rebuilds a changed table from the live schema. It creates the new table,
copies the rows of the columns both keep, drops the old table, renames the
new one and recreates each index whose columns all remain. Foreign keys are
off around the migration's transaction and checked before it commits.

`SchemaDiffer.diff` returns the operations that turn one list of tables into
another, and `SqlSchema` gives the tables of a model or of a model snapshot.
A context's model can be checked against its snapshot without reading a
migration; the first difference throws `SchemaMismatchException`, naming the
table and column:

```ts
import { SqlModelValidator } from "@noldova/context.data.sql";

SqlModelValidator.validate(context.model, new NotesSnapshot(), context.database.connection.dialect);
```

The declaration file `api/index.d.ts` documents every member with its
contract.

## License

MIT; see `LICENSE`.
