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

A context maps entity classes to tables in its `model`. Types are not known
at run time, so a model snapshot records each entity's properties with their
types, and `onModelCreating` configures what the conventions leave out:

```ts
import { DbContext, type ModelBuilder, ModelSnapshot, PropertyType, type SnapshotBuilder } from "@noldova/context.data";

class Author {
  public id: number = 0;
  public name: string = "";
  public posts: Post[] = [];
}

class Post {
  public id: number = 0;
  public title: string = "";
  public authorId: number = 0;
  public author: Author | null = null;
}

class BlogSnapshot extends ModelSnapshot {
  protected override buildModel(builder: SnapshotBuilder): void {
    builder.entity("Author").property("id", PropertyType.Integer).property("name", PropertyType.String).collection("posts", "Post");
    builder.entity("Post").property("id", PropertyType.Integer).property("title", PropertyType.String)
      .property("authorId", PropertyType.Integer).reference("author", "Author");
  }
}

class BlogContext extends DbContext<SqlConnection, SqlMigration> {
  public constructor(options: DbContextOptions<SqlConnection, SqlMigration>) {
    super(options, migrations, new BlogSnapshot());
  }

  protected override onModelCreating(builder: ModelBuilder): void {
    builder.entity(Author).toTable("authors");
    builder.entity(Post);
  }
}
```

By convention, a table takes its class's name and a column its property's;
the key is `id` or the entity's name followed by `Id`, such as `postId`; a
reference's foreign key is its name followed by the principal's key, such as
`authorId`, and pairs with the one navigation back on its principal. Both
match a property's name in any letter case. An
invalid model, or a snapshot the entities no longer match, throws its own
`DataException` when `model` is read.

The declaration file `api/index.d.ts` documents every member with its
contract.

## License

MIT; see `LICENSE`.
