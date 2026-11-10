/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MigrationHistory } from "@noldova/context.data";
import { SqlMigrationHistory } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RecordingConnection } from "../fixtures/recording-connection.fixture.js";

@TestClass
export class SqlMigrationHistoryTests {
  @TestMethod
  public async createsItsTableWhenReadAndRecordsIds(): Promise<void> {
    const connection = new RecordingConnection();
    const history = new SqlMigrationHistory(connection);

    Assert.isInstanceOf(history, MigrationHistory);
    Assert.areEqual(0, (await history.getAppliedAsync()).length);
    await history.recordAsync("20260908130001_B");
    await history.recordAsync("20260908130000_A");

    Assert.areEqual("20260908130000_A,20260908130001_B", (await history.getAppliedAsync()).join(","));
    Assert.areEqual("BEGIN", connection.statements[0]);
    Assert.areEqual("LOCK __migrations", connection.statements[1]);
    Assert.areEqual("CREATE TABLE IF NOT EXISTS \"__migrations\" (\"id\" TEXT PRIMARY KEY, \"appliedAt\" TEXT NOT NULL)", connection.statements[2]);
    Assert.areEqual("SELECT \"id\" FROM \"__migrations\" ORDER BY \"id\"", connection.statements[3]);
    Assert.areEqual("COMMIT", connection.statements[4]);
    Assert.areEqual("INSERT INTO \"__migrations\" (\"id\", \"appliedAt\") VALUES (?, ?)", connection.statements[5]);
  }

  @TestMethod
  public async readsAndRecordsInTheTransactionItIsGiven(): Promise<void> {
    const connection = new RecordingConnection();
    const history = new SqlMigrationHistory(connection);

    const applied = await connection.runInTransactionAsync(async t => {
      await history.recordAsync("20260908130000_A", t);
      return history.getAppliedAsync(t);
    });

    Assert.areEqual("20260908130000_A", applied.join(","));
    Assert.areEqual("BEGIN", connection.statements[0]);
    Assert.areEqual("COMMIT", connection.statements[4]);
  }
}
