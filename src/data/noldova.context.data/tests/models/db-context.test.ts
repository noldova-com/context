/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataSource, DbContext, DbContextOptionsBuilder, StaleSnapshotException } from "@noldova/context.data";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { Author } from "../fixtures/author.fixture.js";
import { BlogContext } from "../fixtures/blog-context.fixture.js";
import { MemoryProvider } from "../fixtures/memory-provider.fixture.js";
import { NotesContext } from "../fixtures/notes-context.fixture.js";
import { Post } from "../fixtures/post.fixture.js";
import { StaleBlogContext } from "../fixtures/stale-blog-context.fixture.js";

@TestClass
export class DbContextTests {
  @TestMethod
  public async opensItsDatabaseWithItsMigrations(): Promise<void> {
    const provider = new MemoryProvider();
    await using context = new NotesContext(new DbContextOptionsBuilder().use(provider, new DataSource("notes", ":memory:")));

    Assert.isInstanceOf(context, DbContext);
    Assert.isTrue(context.database.connection.isOpen);
    Assert.areEqual("20260908130000_Notes,20260908130001_Tags", (await context.database.getPendingMigrationsAsync()).map(t => t.id).join(","));
    Assert.areEqual(2, (await context.database.migrateAsync()).length);
    Assert.areEqual(0, (await context.database.getPendingMigrationsAsync()).length);
  }

  @TestMethod
  public async disposalClosesTheConnection(): Promise<void> {
    const provider = new MemoryProvider();
    const context = new NotesContext(new DbContextOptionsBuilder().use(provider, new DataSource("notes", ":memory:")));
    await context[Symbol.asyncDispose]();

    Assert.isFalse(context.database.connection.isOpen);
    Assert.areEqual(1, provider.connections[0]?.closeCount);
  }

  @TestMethod
  public async buildsItsModelOnceForItsClass(): Promise<void> {
    const options = new DbContextOptionsBuilder().use(new MemoryProvider(), new DataSource("blog", ":memory:"));
    await using first = new BlogContext(options);
    await using second = new BlogContext(options);

    const model = first.model;

    Assert.areEqual(model, second.model);
    Assert.areEqual(1, BlogContext.modelCreations);
    Assert.areEqual("authors", model.findEntityType(Author)?.tableName);
    Assert.areEqual("text", model.findEntityType(Post)?.findProperty("body")?.columnName);
  }

  @TestMethod
  public async mapsNoEntitiesUnlessConfigured(): Promise<void> {
    await using context = new NotesContext(new DbContextOptionsBuilder().use(new MemoryProvider(), new DataSource("notes", ":memory:")));

    Assert.areEqual(0, context.model.entityTypes.count());
  }

  @TestMethod
  public async throwsForAnInvalidModelEachTimeItIsAsked(): Promise<void> {
    await using context = new StaleBlogContext(new DbContextOptionsBuilder().use(new MemoryProvider(), new DataSource("blog", ":memory:")));

    Assert.areEqual("Author", Assert.throws(() => context.model, StaleSnapshotException).entity);
    Assert.areEqual("Author", Assert.throws(() => context.model, StaleSnapshotException).entity);
  }
}
