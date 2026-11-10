/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ChangeOperation } from "@noldova/context.data";
import { SqlMigrator, SqlProvider, SqlQuery } from "@noldova/context.data.sql";
import { SQLiteConnection, SQLiteProvider } from "@noldova/context.data.sql.sqlite";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TemporaryDirectory } from "../fixtures/temporary-directory.fixture.js";

@TestClass
export class SQLiteProviderTests {
  @TestMethod
  public async opensSQLiteConnectionsAndCreatesSqlMigrators(): Promise<void> {
    using directory = new TemporaryDirectory();
    const provider = new SQLiteProvider();
    const dataSource = directory.dataSource("app");

    await using connection = provider.openConnection(dataSource);

    Assert.isInstanceOf(provider, SqlProvider);
    Assert.isInstanceOf(connection, SQLiteConnection);
    Assert.areEqual(dataSource, connection.dataSource);
    Assert.isTrue(connection.isOpen);
    Assert.isInstanceOf(provider.createMigrator(connection, []), SqlMigrator);
  }

  @TestMethod
  @TestData(false)
  @TestData(true)
  public async recoversChangeFeedPreparationAfterRollback(readFirst: boolean): Promise<void> {
    using directory = new TemporaryDirectory();
    const provider = new SQLiteProvider();
    await using connection = provider.openConnection(directory.dataSource("change-feed"));
    const feed = provider.createChangeFeed(connection);

    const rollback = new Error("Rollback fixture");
    Assert.areEqual(rollback, await Assert.throwsAsync(async () => connection.runInTransactionAsync(async t => {
      await feed.appendAsync("note", "discarded", ChangeOperation.Insert, "{}", t);
      throw rollback;
    }), Error));

    if (readFirst)
      Assert.areEqual(0, (await feed.readAfterAsync(0)).length);
    const change = await feed.appendAsync("note", "kept", ChangeOperation.Insert, "{}");
    const changes = await feed.readAfterAsync(0);

    Assert.areEqual(1, change.sequence);
    Assert.areEqual(1, changes.length);
    Assert.areEqual("kept", changes[0]?.entityId);
    const indexes = await connection.queryAsync(new SqlQuery("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'IX___changes_entity_entityId'"));
    Assert.areEqual(1, indexes.length);
  }
}
