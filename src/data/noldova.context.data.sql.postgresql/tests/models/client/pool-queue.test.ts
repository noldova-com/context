/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PoolQueue } from "@noldova/context.data.sql.postgresql/models/client/pool-queue.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class PoolQueueTests {
  @TestMethod
  public shiftsItemsInOrder(): void {
    const queue = new PoolQueue<number>();
    queue.push(1);
    queue.push(2);

    Assert.areEqual(2, queue.length);
    Assert.areEqual(1, queue.peek());
    Assert.areEqual(1, queue.shift());
    Assert.areEqual(1, queue.length);
    Assert.areEqual(2, queue.shift());
    Assert.areEqual(0, queue.length);
    Assert.isUndefined(queue.peek());
    Assert.isUndefined(queue.shift());
    Assert.areEqual(0, queue.length);
  }

  @TestMethod
  public compactsAfterManyShifts(): void {
    const queue = new PoolQueue<number>();
    for (let index = 0; index < 2000; index += 1)
      queue.push(index);
    for (let index = 0; index < 1025; index += 1)
      queue.shift();

    Assert.areEqual(975, queue.length);
    Assert.areEqual(1025, queue.peek());
    queue.push(2000);
    Assert.areEqual(976, queue.length);
    Assert.areEqual(1025, queue.shift());
    Assert.areEqual(975, queue.take().length);
  }

  @TestMethod
  public takesTheRest(): void {
    const queue = new PoolQueue<string>();
    queue.push("a");
    queue.push("b");
    queue.push("c");
    queue.shift();

    Assert.areEqual("b,c", queue.take().join());
    Assert.areEqual(0, queue.length);
    Assert.isUndefined(queue.peek());
  }

  @TestMethod
  public removesTheFirstMatch(): void {
    const queue = new PoolQueue<string>();
    queue.push("a");
    queue.push("b");
    queue.push("b");
    queue.shift();

    Assert.isTrue(queue.remove(item => item === "b"));
    Assert.areEqual(1, queue.length);
    Assert.isFalse(queue.remove(item => item === "a"));
    Assert.areEqual("b", queue.peek());
  }

  @TestMethod
  public putsAnItemBackAtTheHead(): void {
    const queue = new PoolQueue<string>();
    queue.unshift("b");
    queue.push("c");
    queue.unshift("a");
    queue.shift();
    queue.unshift("z");

    Assert.areEqual("z,b,c", queue.toArray().join());
    Assert.areEqual(3, queue.length);
  }

  @TestMethod
  public findsItemsByPositionFromTheHead(): void {
    const queue = new PoolQueue<string>();
    for (const item of ["x", "a", "b", "c"])
      queue.push(item);
    queue.shift();

    Assert.areEqual("a", queue.get(0));
    Assert.areEqual("c", queue.get(2));
    Assert.isUndefined(queue.get(3));
    Assert.isUndefined(queue.get(-1));
    Assert.areEqual(1, queue.indexOf("b"));
    Assert.areEqual(-1, queue.indexOf("x"));
    Assert.areEqual(2, queue.findIndex(item => item === "c"));
    Assert.areEqual(-1, queue.findIndex(item => item === "x"));
    Assert.areEqual("b", queue.find(item => item > "a"));
    Assert.isUndefined(queue.find(item => item === "x"));
  }

  @TestMethod
  public insertsAndRemovesByPositionFromTheHead(): void {
    const queue = new PoolQueue<string>();
    for (const item of ["x", "a", "c"])
      queue.push(item);
    queue.shift();

    queue.insertAt(1, "b");
    Assert.areEqual("a,b,c", queue.toArray().join());
    queue.removeAt(0);
    Assert.areEqual("b,c", queue.toArray().join());
    Assert.areEqual("b", queue.peek());
  }

}
