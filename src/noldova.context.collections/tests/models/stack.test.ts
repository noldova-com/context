/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Stack } from "@noldova/context.collections";
import { InvalidOperationException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class StackTests {
  @TestMethod
  public startsEmptyByDefault(): void {
    const stack = new Stack<number>();

    Assert.areEqual(0, stack.count());
    Assert.areEqual("[]", JSON.stringify(stack.toArray()));
  }

  @TestMethod
  public pushesTheItemsItIsGivenSoTheLastIsOnTop(): void {
    const stack = new Stack([1, 2, 3]);

    Assert.areEqual(3, stack.peek());
    Assert.areEqual(3, stack.count());
  }

  @TestMethod
  public copiesTheItemsItIsGiven(): void {
    const source = [1, 2];
    const stack = new Stack(source);

    source.push(3);

    Assert.areEqual(2, stack.peek());
  }

  @TestMethod
  public enumeratesFromTheTopToTheBottom(): void {
    const stack = new Stack([1, 2]);

    stack.push(3);

    Assert.areEqual("[3,2,1]", JSON.stringify(stack.toArray()));
  }

  @TestMethod
  public popsTheLastPushedItemFirst(): void {
    const stack = new Stack<string>();

    stack.push("a");
    stack.push("b");

    Assert.areEqual("b", stack.pop());
    Assert.areEqual("a", stack.pop());
    Assert.areEqual(0, stack.count());
  }

  @TestMethod
  public peekReturnsTheTopItemWithoutRemovingIt(): void {
    const stack = new Stack([1, 2]);

    Assert.areEqual(2, stack.peek());
    Assert.areEqual(2, stack.count());
  }

  @TestMethod
  public peekAndPopThrowWhenEmpty(): void {
    const stack = new Stack<number>();

    const peek = Assert.throws(() => stack.peek(), InvalidOperationException);
    const pop = Assert.throws(() => stack.pop(), InvalidOperationException);

    Assert.areEqual("The collection is empty.", peek.message);
    Assert.areEqual("The collection is empty.", pop.message);
    Assert.areEqual(0, stack.count());
  }

  @TestMethod
  public tryPeekAndTryPopReturnUndefinedWhenEmpty(): void {
    const stack = new Stack<number>();

    Assert.isUndefined(stack.tryPeek());
    Assert.isUndefined(stack.tryPop());
  }

  @TestMethod
  public tryPeekAndTryPopReturnTheTopItem(): void {
    const stack = new Stack([1, 2]);

    Assert.areEqual(2, stack.tryPeek());
    Assert.areEqual(2, stack.tryPop());
    Assert.areEqual(1, stack.tryPeek());
    Assert.areEqual(1, stack.count());
  }

  @TestMethod
  public holdsNullItems(): void {
    const stack = new Stack<string | null>(["a", null]);

    Assert.isNull(stack.peek());
    Assert.areEqual("[null,\"a\"]", JSON.stringify(stack.toArray()));
    Assert.isNull(stack.tryPop());
    Assert.areEqual("a", stack.pop());
  }

  @TestMethod
  public clearRemovesEveryItem(): void {
    const stack = new Stack([1, 2]);

    stack.clear();

    Assert.areEqual(0, stack.count());
    Assert.isUndefined(stack.tryPeek());
  }

  @TestMethod
  public countsAllOrTheMatchingItems(): void {
    const stack = new Stack([1, 2, 3]);

    Assert.areEqual(3, stack.count());
    Assert.areEqual(2, stack.count(t => t > 1));
  }

  @TestMethod
  public changingTheStackWhileEnumeratingItThrows(): void {
    const stack = new Stack([1, 2, 3]);
    const enumerateWhilePushing = (): void => {
      for (const item of stack)
        stack.push(item);
    };

    const exception = Assert.throws(enumerateWhilePushing, InvalidOperationException);

    Assert.areEqual("The collection was changed while it was being enumerated.", exception.message);
    Assert.areEqual("[3,3,2,1]", JSON.stringify(stack.toArray()));
  }

  @TestMethod
  public everyChangeEndsAnEnumerationInProgress(): void {
    const changes: readonly ((stack: Stack<number>) => void)[] = [t => t.push(9), t => t.pop(), t => t.tryPop(), t => t.clear()];

    for (const change of changes) {
      const stack = new Stack([1, 2]);
      const iterator = stack[Symbol.iterator]();
      iterator.next();

      change(stack);

      Assert.throws(() => iterator.next(), InvalidOperationException);
    }
  }

  @TestMethod
  public peekingWhileEnumeratingDoesNotThrow(): void {
    const stack = new Stack([1, 2]);
    const seen: number[] = [];

    for (const item of stack)
      seen.push(item, stack.peek());

    Assert.areEqual("[2,2,1,2]", JSON.stringify(seen));
  }
}
