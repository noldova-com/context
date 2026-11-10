/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException, Transaction } from "@noldova/context.data";
import { SqlQuery, SqlTransaction } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RecordingSession } from "../fixtures/recording-session.fixture.js";

@TestClass
export class SqlTransactionTests {
  @TestMethod
  public async runsStatementsOnItsSessionAndCommits(): Promise<void> {
    const session = new RecordingSession();
    const transaction = new SqlTransaction(session);

    Assert.areEqual(1, await transaction.executeAsync(new SqlQuery("A")));
    Assert.areEqual(1, await transaction.insertAsync(new SqlQuery("B")));
    Assert.areEqual(0, (await transaction.queryAsync(new SqlQuery("C"))).length);
    await transaction.commitAsync();

    Assert.isInstanceOf(transaction, Transaction);
    Assert.areEqual("A,B,C,COMMIT", session.statements.join(","));
  }

  @TestMethod
  public async rollsBackAndRefusesStatementsOnceCompleted(): Promise<void> {
    const session = new RecordingSession();
    const transaction = new SqlTransaction(session);
    await transaction.rollbackAsync();

    await Assert.throwsAsync(async () => transaction.executeAsync(new SqlQuery("A")), DataException);
    await Assert.throwsAsync(async () => transaction.insertAsync(new SqlQuery("A")), DataException);
    await Assert.throwsAsync(async () => transaction.queryAsync(new SqlQuery("A")), DataException);
    Assert.areEqual("ROLLBACK", session.statements.join(","));
  }
}
