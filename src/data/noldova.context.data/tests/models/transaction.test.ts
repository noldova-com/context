/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { MemoryTransaction } from "../fixtures/memory-transaction.fixture.js";

@TestClass
export class TransactionTests {
  @TestMethod
  public async commitsOnce(): Promise<void> {
    const transaction = new MemoryTransaction();

    Assert.isFalse(transaction.isCompleted);
    await transaction.commitAsync();

    Assert.isTrue(transaction.isCompleted);
    Assert.areEqual(1, transaction.commits);
    await Assert.throwsAsync(async () => transaction.commitAsync(), DataException);
    await Assert.throwsAsync(async () => transaction.rollbackAsync(), DataException);
  }

  @TestMethod
  public async rollsBackOnce(): Promise<void> {
    const transaction = new MemoryTransaction();
    await transaction.rollbackAsync();

    Assert.isTrue(transaction.isCompleted);
    Assert.areEqual(1, transaction.rollbacks);
    await Assert.throwsAsync(async () => transaction.rollbackAsync(), DataException);
  }

  @TestMethod
  public async disposalRollsBackAnIncompleteTransactionOnly(): Promise<void> {
    const incomplete = new MemoryTransaction();
    const committed = new MemoryTransaction();
    await committed.commitAsync();

    await incomplete[Symbol.asyncDispose]();
    await committed[Symbol.asyncDispose]();

    Assert.areEqual(1, incomplete.rollbacks);
    Assert.areEqual(0, committed.rollbacks);
  }

  @TestMethod
  public async leavesAFailedCommitIncompleteSoDisposalRollsBack(): Promise<void> {
    const transaction = new MemoryTransaction();
    const failure = new Error("Commit failed");
    transaction.commitFailure = failure;

    Assert.areEqual(failure, await Assert.throwsAsync(async () => transaction.commitAsync(), Error));
    Assert.isFalse(transaction.isCompleted);
    await transaction[Symbol.asyncDispose]();

    Assert.isTrue(transaction.isCompleted);
    Assert.areEqual(1, transaction.commits);
    Assert.areEqual(1, transaction.rollbacks);
  }

  @TestMethod
  public async joinsANestedActionAndRefusesOneOnceCompleted(): Promise<void> {
    const transaction = new MemoryTransaction();

    Assert.areEqual(3, await transaction.runInTransactionAsync(async t => {
      Assert.areEqual(transaction, t);
      return 3;
    }));
    Assert.isFalse(transaction.isRollbackOnly);
    await Assert.throwsAsync(async () => transaction.runInTransactionAsync(async () => {
      throw new Error("nested");
    }), Error);
    Assert.isTrue(transaction.isRollbackOnly);
    await transaction.rollbackAsync();

    await Assert.throwsAsync(async () => transaction.runInTransactionAsync(async () => 1), DataException);
    await Assert.throwsAsync(async () => transaction.recordAsync("late"), DataException);
  }

  @TestMethod
  public async leavesAFailedRollbackIncomplete(): Promise<void> {
    const transaction = new MemoryTransaction();
    const failure = new Error("Rollback failed");
    transaction.rollbackFailure = failure;

    Assert.areEqual(failure, await Assert.throwsAsync(async () => transaction.rollbackAsync(), Error));
    Assert.isFalse(transaction.isCompleted);
  }
}
