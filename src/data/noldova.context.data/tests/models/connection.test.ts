/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { MemoryConnection } from "../fixtures/memory-connection.fixture.js";

@TestClass
export class ConnectionTests {
  @TestMethod
  public async isOpenOnItsDataSourceUntilClosed(): Promise<void> {
    const connection = new MemoryConnection();

    Assert.areEqual("memory", connection.dataSource.name);
    Assert.isTrue(connection.isOpen);
    await connection.closeAsync();
    await connection.closeAsync();

    Assert.isFalse(connection.isOpen);
    Assert.areEqual(2, connection.closeCount);
    await Assert.throwsAsync(async () => connection.runInTransactionAsync(async () => 1), DataException);
    await Assert.throwsAsync(async () => connection.recordAsync("closed"), DataException);
    Assert.areEqual(0, connection.transactions.length);
  }

  @TestMethod
  public async commitsATransactionThatReturns(): Promise<void> {
    const connection = new MemoryConnection();

    const result = await connection.runInTransactionAsync(async t => {
      Assert.isTrue(connection.isInTransaction);
      await t.recordAsync("a");
      return 42;
    });

    Assert.areEqual(42, result);
    Assert.areEqual("a", connection.log.join(","));
    Assert.areEqual(1, connection.transactions[0]?.commits);
    Assert.isFalse(connection.isInTransaction);
  }

  @TestMethod
  public async rollsBackATransactionThatThrowsAndRethrows(): Promise<void> {
    const connection = new MemoryConnection();

    const failure = await Assert.throwsAsync(async () => connection.runInTransactionAsync(async () => {
      throw new Error("stop");
    }), Error);

    Assert.areEqual("stop", failure.message);
    Assert.areEqual(1, connection.transactions[0]?.rollbacks);
    Assert.isFalse(connection.isInTransaction);
  }

  @TestMethod
  public async runsTheTransactionsOwnOperationsAndNestedActionsInsideAnAction(): Promise<void> {
    const connection = new MemoryConnection();

    const result = await connection.runInTransactionAsync(async outer => {
      await outer.recordAsync("outer");
      const inner = await outer.runInTransactionAsync(async t => {
        Assert.areEqual(outer, t);
        await t.recordAsync("inner");
        return t.runInTransactionAsync(async innermost => {
          await innermost.recordAsync("innermost");
          return 7;
        });
      });
      return inner + 1;
    });

    Assert.areEqual(8, result);
    Assert.areEqual("outer,inner,innermost", connection.log.join(","));
    Assert.areEqual(1, connection.transactions.length);
    Assert.areEqual(1, connection.transactions[0]?.commits);
  }

  @TestMethod
  public async rollsBackTheOuterTransactionWhenANestedActionFails(): Promise<void> {
    const connection = new MemoryConnection();

    const propagated = await Assert.throwsAsync(async () => connection.runInTransactionAsync(async t => t.runInTransactionAsync(async () => {
      throw new Error("inner");
    })), Error);
    const swallowed = await Assert.throwsAsync(async () => connection.runInTransactionAsync(async t => {
      try {
        await t.runInTransactionAsync(async () => {
          throw new Error("inner");
        });
      }
      catch {
        Assert.isTrue(t.isRollbackOnly);
        return "ignored";
      }
      return "unreachable";
    }), DataException);

    Assert.areEqual("inner", propagated.message);
    Assert.areEqual(1, connection.transactions[0]?.rollbacks);
    Assert.areEqual(0, connection.transactions[0]?.commits);
    Assert.isTrue(swallowed.message.startsWith("An inner transaction failed"));
    Assert.areEqual(1, connection.transactions[1]?.rollbacks);
    Assert.isFalse(connection.isInTransaction);
  }

  @TestMethod
  public async runsTransactionsStartedAtOnceOneAfterTheOtherEachCommittingOrRollingBackAlone(): Promise<void> {
    const connection = new MemoryConnection();
    const gate = Promise.withResolvers<void>();

    const first = connection.runInTransactionAsync(async t => {
      await t.recordAsync("first started");
      await gate.promise;
      await t.recordAsync("first ended");
      throw new Error("first");
    });
    const second = connection.runInTransactionAsync(async t => {
      await t.recordAsync("second");
      return "second";
    });
    const outside = connection.recordAsync("outside");
    gate.resolve();

    Assert.areEqual("first", (await Assert.throwsAsync(async () => first, Error)).message);
    Assert.areEqual("second", await second);
    await outside;
    Assert.areEqual("first started,first ended,second,outside", connection.log.join(","));
    Assert.areEqual(1, connection.transactions[0]?.rollbacks);
    Assert.areEqual(0, connection.transactions[0]?.commits);
    Assert.areEqual(0, connection.transactions[1]?.rollbacks);
    Assert.areEqual(1, connection.transactions[1]?.commits);
    Assert.isFalse(connection.isInTransaction);
  }

  @TestMethod
  public async closesOnlyOnceARunningTransactionHasEnded(): Promise<void> {
    const connection = new MemoryConnection();
    const gate = Promise.withResolvers<void>();

    const running = connection.runInTransactionAsync(async t => {
      await gate.promise;
      Assert.isTrue(connection.isOpen);
      await t.recordAsync("last");
    });
    const closing = connection.closeAsync();
    gate.resolve();
    await running;
    await closing;

    Assert.isFalse(connection.isOpen);
    Assert.areEqual("last", connection.log.join(","));
    Assert.areEqual(1, connection.transactions[0]?.commits);
  }

  @TestMethod
  public async disposalCloses(): Promise<void> {
    const connection = new MemoryConnection();
    await connection[Symbol.asyncDispose]();

    Assert.isFalse(connection.isOpen);
  }

  @TestMethod
  @TestData(false)
  @TestData(true)
  public async preservesTheOriginalFailureWhenRollbackAlsoFails(failOnCommit: boolean): Promise<void> {
    const connection = new MemoryConnection();
    const original = new Error("Original failure");
    const rollback = new Error("Rollback failed");

    const failure = await Assert.throwsAsync(async () => connection.runInTransactionAsync(async t => {
      t.rollbackFailure = rollback;
      if (failOnCommit)
        t.commitFailure = original;
      else
        throw original;
      return 42;
    }), SuppressedError);

    Assert.areEqual(original, failure.suppressed);
    Assert.areEqual(rollback, failure.error);
    Assert.areEqual("The transaction failed and rollback also failed.", failure.message);
    Assert.areEqual(1, connection.transactions[0]?.rollbacks);
    Assert.isFalse(connection.isInTransaction);
  }
}
