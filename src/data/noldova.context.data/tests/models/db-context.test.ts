/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataSource, DbContext, DbContextOptionsBuilder } from "@noldova/context.data";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { MemoryProvider } from "../fixtures/memory-provider.fixture.js";
import { NotesContext } from "../fixtures/notes-context.fixture.js";

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
}
