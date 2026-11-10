/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ChangeFeed, ChangeOperation } from "@noldova/context.data";
import { ArgumentException, ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { MemoryChangeFeed } from "../fixtures/memory-change-feed.fixture.js";
import { MemoryTransaction } from "../fixtures/memory-transaction.fixture.js";

@TestClass
export class ChangeFeedTests {
  @TestMethod
  public async appendsAndReadsAfterASequence(): Promise<void> {
    const feed = new MemoryChangeFeed();
    for (const id of ["a", "b", "c"])
      await feed.appendAsync("note", id, ChangeOperation.Insert, id);

    Assert.isInstanceOf(feed, ChangeFeed);
    Assert.areEqual("a,b,c", (await feed.readAfterAsync(0)).map(t => t.entityId).join(","));
    Assert.areEqual("b,c", (await feed.readAfterAsync(1)).map(t => t.entityId).join(","));
    Assert.areEqual("a,b", (await feed.readAfterAsync(0, 2)).map(t => t.entityId).join(","));
    Assert.areEqual(0, (await feed.readAfterAsync(3)).length);
  }

  @TestMethod
  public async passesTheTransactionItIsGivenToTheStore(): Promise<void> {
    const feed = new MemoryChangeFeed();
    const transaction = new MemoryTransaction();

    await feed.appendAsync("note", "a", ChangeOperation.Insert, "{}", transaction);
    await feed.readAfterAsync(0, 10, transaction);
    await feed.appendAsync("note", "b", ChangeOperation.Insert, "{}");

    Assert.areEqual(transaction, feed.transactions[0]);
    Assert.areEqual(transaction, feed.transactions[1]);
    Assert.isUndefined(feed.transactions[2]);
  }

  @TestMethod
  public async validatesArgumentsBeforeTheStoreSeesThem(): Promise<void> {
    const feed = new MemoryChangeFeed();

    Assert.areEqual("entity", (await Assert.throwsAsync(async () => feed.appendAsync(" ", "id", ChangeOperation.Insert, ""), ArgumentException)).parameterName);
    Assert.areEqual("entityId", (await Assert.throwsAsync(async () => feed.appendAsync("note", "", ChangeOperation.Insert, ""), ArgumentException)).parameterName);
    Assert.areEqual("sequence", (await Assert.throwsAsync(async () => feed.readAfterAsync(-1), ArgumentOutOfRangeException)).parameterName);
    await Assert.throwsAsync(async () => feed.readAfterAsync(0.5), ArgumentOutOfRangeException);
    Assert.areEqual("limit", (await Assert.throwsAsync(async () => feed.readAfterAsync(0, 0), ArgumentOutOfRangeException)).parameterName);
    Assert.areEqual(0, feed.changes.length);
  }
}
