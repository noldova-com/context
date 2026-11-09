/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ChangeFeed, ChangeOperation, DataProvider, DataSource, Migrator } from "@noldova/context.data";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { MemoryProvider } from "../fixtures/memory-provider.fixture.js";
import { NotesMigration } from "../fixtures/notes-migration.fixture.js";

@TestClass
export class DataProviderTests {
  @TestMethod
  public async opensConnectionsAndCreatesMigratorsAndChangeFeedsForItsStoreKind(): Promise<void> {
    const provider = new MemoryProvider();
    const dataSource = new DataSource("notes", ":memory:");

    const connection = provider.openConnection(dataSource);
    const migrator = provider.createMigrator(connection, [new NotesMigration()]);
    const changeFeed = provider.createChangeFeed(connection);

    Assert.isInstanceOf(provider, DataProvider);
    Assert.areEqual(dataSource, connection.dataSource);
    Assert.isInstanceOf(migrator, Migrator);
    Assert.areEqual(1, (await migrator.getPendingMigrationsAsync()).length);
    Assert.isInstanceOf(changeFeed, ChangeFeed);
    Assert.areEqual(1, (await changeFeed.appendAsync("note", "a", ChangeOperation.Insert, "{}")).sequence);
  }
}
