/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";
import { SqlQuery, SqlTransaction } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RecordingConnection } from "../fixtures/recording-connection.fixture.js";

@TestClass
export class SqlConnectionTests {
  @TestMethod
  public async runsStatementsOnItsSessionInItsTurn(): Promise<void> {
    const connection = new RecordingConnection();

    const changed = await connection.executeAsync(new SqlQuery("DELETE FROM \"notes\""));
    const key = await connection.insertAsync(new SqlQuery("INSERT INTO \"notes\" DEFAULT VALUES"));
    const rows = await connection.queryAsync(new SqlQuery("SELECT 1"));

    Assert.areEqual("recording", connection.dataSource.name);
    Assert.areEqual(1, changed);
    Assert.areEqual(1, key);
    Assert.areEqual(0, rows.length);
    Assert.areEqual("DELETE FROM \"notes\",INSERT INTO \"notes\" DEFAULT VALUES,SELECT 1", connection.statements.join(","));
  }

  @TestMethod
  public async runsAnActionInASqlTransaction(): Promise<void> {
    const connection = new RecordingConnection();

    const result = await connection.runInTransactionAsync(async t => {
      Assert.isInstanceOf(t, SqlTransaction);
      await t.executeAsync(new SqlQuery("INSERT INTO \"notes\" (\"id\") VALUES ('a')"));
      return 42;
    });
    await Assert.throwsAsync(async () => connection.runInTransactionAsync(async () => {
      throw new Error("stop");
    }), Error);

    Assert.areEqual(42, result);
    Assert.areEqual("BEGIN,INSERT INTO \"notes\" (\"id\") VALUES ('a'),COMMIT,BEGIN,ROLLBACK", connection.statements.join(","));
  }

  @TestMethod
  public async runsTheTransactionsOwnStatementsAndNestedActionsInsideAnAction(): Promise<void> {
    const connection = new RecordingConnection();

    const key = await connection.runInTransactionAsync(async t => {
      await t.executeAsync(new SqlQuery("UPDATE \"notes\" SET \"text\" = 'a'"));
      const inserted = await t.runInTransactionAsync(async nested => nested.insertAsync(new SqlQuery("INSERT INTO \"notes\" DEFAULT VALUES")));
      await t.queryAsync(new SqlQuery("SELECT 1"));
      return inserted;
    });

    Assert.areEqual(1, key);
    Assert.areEqual("BEGIN,UPDATE \"notes\" SET \"text\" = 'a',INSERT INTO \"notes\" DEFAULT VALUES,SELECT 1,COMMIT", connection.statements.join(","));
  }

  @TestMethod
  public async runsTwoTransactionsAndAStatementOneAfterAnother(): Promise<void> {
    const connection = new RecordingConnection();

    await Promise.all([
      connection.runInTransactionAsync(async t => {
        await t.executeAsync(new SqlQuery("A1"));
        await t.executeAsync(new SqlQuery("A2"));
      }),
      connection.executeAsync(new SqlQuery("OUTSIDE")),
      connection.runInTransactionAsync(async t => {
        await t.executeAsync(new SqlQuery("B1"));
        await t.executeAsync(new SqlQuery("B2"));
      })
    ]);

    Assert.areEqual("BEGIN,A1,A2,COMMIT,OUTSIDE,BEGIN,B1,B2,COMMIT", connection.statements.join(","));
  }

  @TestMethod
  public async closesItsSessionInItsTurn(): Promise<void> {
    const connection = new RecordingConnection();

    await Promise.all([
      connection.runInTransactionAsync(async t => t.executeAsync(new SqlQuery("A1"))),
      connection.closeAsync()
    ]);

    Assert.areEqual("BEGIN,A1,COMMIT", connection.statements.join(","));
    Assert.isFalse(connection.isOpen);
    Assert.areEqual(1, connection.session.closeCount);
  }

  @TestMethod
  public async refusesStatementsAndTransactionsOnceClosed(): Promise<void> {
    const connection = new RecordingConnection();
    await connection.closeAsync();

    await Assert.throwsAsync(async () => connection.executeAsync(new SqlQuery("A")), DataException);
    await Assert.throwsAsync(async () => connection.insertAsync(new SqlQuery("A")), DataException);
    await Assert.throwsAsync(async () => connection.queryAsync(new SqlQuery("A")), DataException);
    await Assert.throwsAsync(async () => connection.runInTransactionAsync(async () => 1), DataException);
    Assert.areEqual(0, connection.statements.length);
  }
}
