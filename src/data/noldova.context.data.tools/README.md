# noldova.context.data.tools

The data context's commands for `ctx`: `ctx migrations add` writes the next
migration of a data context from its model, with the model snapshot and the
list of the context's migrations.

## Install

```bash
npm install --save-dev @noldova/context.data.tools
```

The project names it in its `.ctxp`:

```json
{
  "name": "notes",
  "kind": "executable",
  "tools": ["noldova.context.data.tools"]
}
```

## Use

Build the project first: the command imports the compiled context, the
compiled model snapshot and the provider.

```bash
ctx migrations add AddNotes --provider noldova.context.data.sql.sqlite
```

- `<Name>`: the migration's name, PascalCase, such as `AddNotes`.
- `--provider <identity>`: the SQL provider whose column types the migration
  uses, such as `noldova.context.data.sql.sqlite` or
  `noldova.context.data.sql.postgresql`.
- `--context <Class>`: the data context, when the project has more than one.
- `--output <folder>`: where the files go, relative to the project's folder;
  by default `migrations/<provider>` beside the context's source, such as
  `migrations/sqlite`.

The command reads the project's `tsconfig.json`, beside its `.ctxp`, for the
sources (`rootDir`) and the compiled output (`outDir`), following a relative
`extends`; the file is plain JSON, without comments. It finds the classes
that extend `DbContext`, runs the context's `onModelCreating` without
constructing it, and reads each mapped entity's property types from its
source: `string` and `number` are columns, `| null` makes one optional, a
mapped entity class with `| null` is a reference, and an array of one is a
collection. Any other type fails, naming the class and the property.

It compares the model with the snapshot of the last migration and writes, in
the output folder:

- `<id>-<name>.ts`: the migration, such as `20261127120000-add-notes.ts` with
  the class `AddNotes`, its id the time in UTC, after every existing id;
- `<context>-model-snapshot.ts`: the model as of the new migration;
- `<context>-migrations.ts`: every migration in the folder, in id order, as
  `static all`.

With no change since the last migration, it writes nothing and says so. A
name an earlier migration in the folder has fails, and so does a wrong
argument or a project the command can't read; `ctx` prints why and returns 1.
The context passes the list and the snapshot to `DbContext`:

```ts
import { NotesContextMigrations } from "./migrations/sqlite/notes-context-migrations.js";
import { NotesContextModelSnapshot } from "./migrations/sqlite/notes-context-model-snapshot.js";

super(options, NotesContextMigrations.all, new NotesContextModelSnapshot());
```

Build the project before each run, and leave the files the command writes
as it wrote them: it reads the last snapshot from the compiled project, and
fails when that doesn't match the snapshot's source, such as on a second run
without a build in between.

What the command doesn't do yet:

- A rename is written as a drop and an add, which loses the column's or the
  table's rows.
- A foreign key over more than one column is written as one foreign key for
  each column. PostgreSQL refuses each one unless its column alone refers to
  a unique key.
- On PostgreSQL, a migration that changes a primary key that unchanged
  foreign keys refer to fails, because the key can't be dropped while they
  depend on it.
- A required column's default is written as the provider's SQL, such as
  `''` or `0`, so each provider has its own migrations; a default set by
  hand in a migration isn't read back.
- The `tsconfig.json` is plain JSON, without comments, and its `extends` is
  read as a path beside it; one that names a package fails as a file the
  command can't read.

## License

MIT; see `LICENSE`.
