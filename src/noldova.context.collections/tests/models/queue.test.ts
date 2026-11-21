/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Queue } from "@noldova/context.collections";
import { InvalidOperationException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class QueueTests {
  @TestMethod
  public startsEmptyByDefault(): void {
    const queue = new Queue<number>();

    Assert.areEqual(0, queue.count());
    Assert.areEqual("[]", JSON.stringify(queue.toArray()));
  }

  @TestMethod
  public enqueuesTheItemsItIsGivenInOrder(): void {
    const queue = new Queue([1, 2, 3, 4, 5]);

    Assert.areEqual(5, queue.count());
    Assert.areEqual(1, queue.peek());
    Assert.areEqual("[1,2,3,4,5]", JSON.stringify(queue.toArray()));
  }

  @TestMethod
  public dequeuesInTheOrderItemsWereEnqueued(): void {
    const queue = new Queue<string>();

    queue.enqueue("a");
    queue.enqueue("b");

    Assert.areEqual("a", queue.dequeue());
    Assert.areEqual("b", queue.dequeue());
    Assert.areEqual(0, queue.count());
  }

  @TestMethod
  public keepsItsOrderWhenItWrapsAroundAndGrowsWhileWrapped(): void {
    const queue = new Queue([1, 2, 3, 4]);

    Assert.areEqual(1, queue.dequeue());
    Assert.areEqual(2, queue.dequeue());
    queue.enqueue(5);
    queue.enqueue(6);

    Assert.areEqual("[3,4,5,6]", JSON.stringify(queue.toArray()));

    queue.enqueue(7);

    Assert.areEqual("[3,4,5,6,7]", JSON.stringify(queue.toArray()));
    Assert.areEqual(5, queue.count());
    Assert.areEqual(3, queue.dequeue());
    Assert.areEqual(4, queue.dequeue());
    Assert.areEqual(5, queue.dequeue());
    Assert.areEqual(6, queue.dequeue());
    Assert.areEqual(7, queue.dequeue());
    Assert.areEqual(0, queue.count());
  }

  @TestMethod
  public keepsItsOrderOverManyEnqueuesAndDequeues(): void {
    const queue = new Queue<number>();
    const dequeued: number[] = [];

    for (let item = 0; item < 20; item++) {
      queue.enqueue(item);
      if (item % 3 === 2)
        dequeued.push(queue.dequeue(), queue.dequeue());
    }

    Assert.areEqual("[0,1,2,3,4,5,6,7,8,9,10,11]", JSON.stringify(dequeued));
    Assert.areEqual("[12,13,14,15,16,17,18,19]", JSON.stringify(queue.toArray()));
  }

  @TestMethod
  public peekReturnsTheFrontItemWithoutRemovingIt(): void {
    const queue = new Queue([1, 2]);

    Assert.areEqual(1, queue.peek());
    Assert.areEqual(2, queue.count());
  }

  @TestMethod
  public peekAndDequeueThrowWhenEmpty(): void {
    const queue = new Queue<number>();

    const peek = Assert.throws(() => queue.peek(), InvalidOperationException);
    const dequeue = Assert.throws(() => queue.dequeue(), InvalidOperationException);

    Assert.areEqual("The collection is empty.", peek.message);
    Assert.areEqual("The collection is empty.", dequeue.message);
    Assert.areEqual(0, queue.count());
  }

  @TestMethod
  public dequeueThrowsOnceTheQueueIsDrained(): void {
    const queue = new Queue([1]);

    queue.dequeue();

    const exception = Assert.throws(() => queue.dequeue(), InvalidOperationException);

    Assert.areEqual("The collection is empty.", exception.message);
    Assert.areEqual(0, queue.count());
  }

  @TestMethod
  public tryPeekAndTryDequeueReturnUndefinedWhenEmpty(): void {
    const queue = new Queue<number>();

    Assert.isUndefined(queue.tryPeek());
    Assert.isUndefined(queue.tryDequeue());
    Assert.areEqual(0, queue.count());
  }

  @TestMethod
  public tryPeekAndTryDequeueReturnTheFrontItem(): void {
    const queue = new Queue([1, 2]);

    Assert.areEqual(1, queue.tryPeek());
    Assert.areEqual(1, queue.tryDequeue());
    Assert.areEqual(2, queue.tryPeek());
    Assert.areEqual(1, queue.count());
  }

  @TestMethod
  public holdsNullItems(): void {
    const queue = new Queue<string | null>([null, "a"]);

    Assert.isNull(queue.peek());
    Assert.areEqual("[null,\"a\"]", JSON.stringify(queue.toArray()));
    Assert.isNull(queue.tryDequeue());
    Assert.areEqual("a", queue.dequeue());
  }

  @TestMethod
  public clearRemovesEveryItemAndTheQueueStaysUsable(): void {
    const queue = new Queue([1, 2, 3]);

    queue.clear();

    Assert.areEqual(0, queue.count());
    Assert.isUndefined(queue.tryPeek());
    queue.enqueue(4);
    Assert.areEqual("[4]", JSON.stringify(queue.toArray()));
  }

  @TestMethod
  public countsAllOrTheMatchingItems(): void {
    const queue = new Queue([1, 2, 3]);

    Assert.areEqual(3, queue.count());
    Assert.areEqual(2, queue.count(t => t > 1));
  }

  @TestMethod
  public changingTheQueueWhileEnumeratingItThrows(): void {
    const queue = new Queue([1, 2, 3]);
    const enumerateWhileEnqueueing = (): void => {
      for (const item of queue)
        queue.enqueue(item);
    };

    const exception = Assert.throws(enumerateWhileEnqueueing, InvalidOperationException);

    Assert.areEqual("The collection was changed while it was being enumerated.", exception.message);
    Assert.areEqual("[1,2,3,1]", JSON.stringify(queue.toArray()));
  }

  @TestMethod
  public everyChangeEndsAnEnumerationInProgress(): void {
    const changes: readonly ((queue: Queue<number>) => void)[] = [t => t.enqueue(9), t => t.dequeue(), t => t.tryDequeue(), t => t.clear()];

    for (const change of changes) {
      const queue = new Queue([1, 2]);
      const iterator = queue[Symbol.iterator]();
      iterator.next();

      change(queue);

      Assert.throws(() => iterator.next(), InvalidOperationException);
    }
  }

  @TestMethod
  public peekingWhileEnumeratingDoesNotThrow(): void {
    const queue = new Queue([1, 2]);
    const seen: number[] = [];

    for (const item of queue)
      seen.push(item, queue.peek());

    Assert.areEqual("[1,1,2,1]", JSON.stringify(seen));
  }
}
