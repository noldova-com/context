/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { ChangeOperation } from "@noldova/context.data";
import { SqlQuery } from "@noldova/context.data.sql";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { NotesContext } from "../fixtures/notes-context.fixture.js";
import { ProviderDatabase } from "../fixtures/provider-database.fixture.js";

@TestClass
export class ProviderTests {
  @TestMethod
  @TestData("sqlite")
  @TestData("postgresql")
  public async appliesEachMigrationOnce(provider: string): Promise<void> {
    await using database = await ProviderDatabase.createAsync(provider);
    await using context = new NotesContext(database.options());

    Assert.areEqual(1, (await context.database.getPendingMigrationsAsync()).length);
    Assert.areEqual("20260908130000_Notes", (await context.database.migrateAsync()).join(","));
    Assert.areEqual(0, (await context.database.migrateAsync()).length);
    Assert.areEqual("20260908130000_Notes", (await context.database.getAppliedMigrationsAsync()).join(","));
    Assert.areEqual(0, (await context.database.getPendingMigrationsAsync()).length);
  }

  @TestMethod
  @TestData("sqlite")
  @TestData("postgresql")
  public async writesAndReadsTheMigratedTables(provider: string): Promise<void> {
    await using database = await ProviderDatabase.createAsync(provider);
    await using context = new NotesContext(database.options());
    await context.database.migrateAsync();
    const connection = context.database.connection;

    Assert.areEqual(1, await connection.executeAsync(new SqlQuery("INSERT INTO notes (id, text) VALUES (?, ?)", ["b", "second"])));
    Assert.areEqual(1, await connection.executeAsync(new SqlQuery("INSERT INTO notes (id, text) VALUES (?, ?)", ["a", "first"])));
    const records = await connection.queryAsync(new SqlQuery("SELECT id, text FROM notes WHERE text <> ? ORDER BY id", ["none"]));

    Assert.areEqual("a:first,b:second", records.map(t => `${String(t.readValue("id"))}:${String(t.readValue("text"))}`).join(","));
  }

  @TestMethod
  @TestData("sqlite")
  @TestData("postgresql")
  public async readsTheChangeFeedInSequenceOrder(provider: string): Promise<void> {
    await using database = await ProviderDatabase.createAsync(provider);
    await using context = new NotesContext(database.options());
    await context.database.migrateAsync();
    const feed = context.database.changeFeed;

    const first = await feed.appendAsync("note", "a", ChangeOperation.Insert, "{\"text\":\"first\"}");
    const second = await feed.appendAsync("note", "a", ChangeOperation.Update, "{\"text\":\"again\"}");
    const all = await feed.readAfterAsync(0);
    const after = await feed.readAfterAsync(first.sequence);

    Assert.areEqual(1, first.sequence);
    Assert.areEqual(2, second.sequence);
    Assert.areEqual("1:Insert:a,2:Update:a", all.map(t => `${String(t.sequence)}:${t.operation}:${t.entityId}`).join(","));
    Assert.areEqual("{\"text\":\"again\"}", after.map(t => t.payload).join(","));
    Assert.areEqual(1, (await feed.readAfterAsync(0, 1)).length);
  }
}
