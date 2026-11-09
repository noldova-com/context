/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ChangeFeed, ChangeOperation, DataException, DataRecord, type DataValue } from "@noldova/context.data";
import { SqlChangeFeed, SqlQuery } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RecordingConnection } from "../fixtures/recording-connection.fixture.js";

@TestClass
export class SqlChangeFeedTests {
  private static readonly createTable: string = "CREATE TABLE IF NOT EXISTS \"__changes\" (\"sequence\" INTEGER PRIMARY KEY, \"entity\" TEXT NOT NULL, \"entityId\" TEXT NOT NULL, \"operation\" TEXT NOT NULL, \"payload\" TEXT NOT NULL, \"createdAt\" TEXT NOT NULL)";
  private static readonly createIndex: string = "CREATE INDEX IF NOT EXISTS \"IX___changes_entity_entityId\" ON \"__changes\" (\"entity\", \"entityId\")";
  private static readonly select: string =
    "SELECT \"sequence\", \"entity\", \"entityId\", \"operation\", \"payload\", \"createdAt\" FROM \"__changes\" WHERE \"sequence\" > ? ORDER BY \"sequence\" LIMIT ?";
  private static readonly insert: string = "INSERT INTO \"__changes\" (\"entity\", \"entityId\", \"operation\", \"payload\", \"createdAt\") VALUES (?, ?, ?, ?, ?)";

  @TestMethod
  public async appendsInATransactionOfItsOwnUnderTheLock(): Promise<void> {
    const connection = new RecordingConnection();
    const feed = new SqlChangeFeed(connection);

    const first = await feed.appendAsync("note", "a", ChangeOperation.Insert, "{}");
    const second = await feed.appendAsync("note", "a", ChangeOperation.Delete, "{}");

    Assert.isInstanceOf(feed, ChangeFeed);
    Assert.areEqual(1, first.sequence);
    Assert.areEqual(2, second.sequence);
    Assert.areEqual(ChangeOperation.Delete, second.operation);
    const append = ["BEGIN", "LOCK __changes", SqlChangeFeedTests.createTable, SqlChangeFeedTests.createIndex, SqlChangeFeedTests.insert, "COMMIT"];
    Assert.areEqual([...append, ...append].join("|"), connection.statements.join("|"));
  }

  @TestMethod
  public async appendsInTheTransactionItIsGiven(): Promise<void> {
    const connection = new RecordingConnection();
    const feed = new SqlChangeFeed(connection);

    const change = await connection.runInTransactionAsync(async t => {
      await t.executeAsync(new SqlQuery("UPDATE \"notes\""));
      return feed.appendAsync("note", "a", ChangeOperation.Update, "{}", t);
    });

    Assert.areEqual(1, change.sequence);
    Assert.areEqual(
      ["BEGIN", "UPDATE \"notes\"", "LOCK __changes", SqlChangeFeedTests.createTable, SqlChangeFeedTests.createIndex, SqlChangeFeedTests.insert, "COMMIT"].join("|"),
      connection.statements.join("|"));
  }

  @TestMethod
  public async readsTheRecordsTheStoreReturns(): Promise<void> {
    const connection = new RecordingConnection();
    connection.session.queryResults.push(SqlChangeFeedTests.createRecord(3, "Delete"), SqlChangeFeedTests.createRecord(4, "Insert"));
    const feed = new SqlChangeFeed(connection);

    const changes = await feed.readAfterAsync(2, 10);
    const inTransaction = await connection.runInTransactionAsync(async t => feed.readAfterAsync(2, 10, t));

    Assert.areEqual("3,4", changes.map(t => t.sequence).join(","));
    Assert.areEqual(2, inTransaction.length);
    Assert.areEqual(ChangeOperation.Delete, changes[0]?.operation);
    Assert.areEqual("{\"id\":\"a\"}", changes[0]?.payload);
    const read = ["BEGIN", "LOCK __changes", SqlChangeFeedTests.createTable, SqlChangeFeedTests.createIndex, SqlChangeFeedTests.select, "COMMIT"];
    Assert.areEqual([...read, ...read].join("|"), connection.statements.join("|"));
  }

  @TestMethod
  public async rejectsRecordsWithUnknownOperations(): Promise<void> {
    const connection = new RecordingConnection();
    connection.session.queryResults.push(SqlChangeFeedTests.createRecord(1, "upsert"));
    const feed = new SqlChangeFeed(connection);

    await Assert.throwsAsync(async () => feed.readAfterAsync(0), DataException);
  }

  private static createRecord(sequence: number, operation: string): DataRecord {
    const values: [string, DataValue][] = [["sequence", sequence], ["entity", "note"], ["entityId", "a"], ["operation", operation], ["payload", "{\"id\":\"a\"}"], ["createdAt", "t"]];
    return new DataRecord(new Map(values));
  }
}
