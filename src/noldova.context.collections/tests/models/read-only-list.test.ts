/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Enumerable, List, ReadOnlyList } from "@noldova/context.collections";
import { ArgumentOutOfRangeException, InvalidOperationException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ReadOnlyListTests {
  @TestMethod
  public readsTheItemsOfItsList(): void {
    const view = new List(["a", "b", "c"]).asReadOnly();

    Assert.isInstanceOf(view, ReadOnlyList);
    Assert.areEqual("b", view.get(1));
    Assert.areEqual("a", view.tryGet(0));
    Assert.isUndefined(view.tryGet(3));
    Assert.areEqual(2, view.indexOf("c"));
    Assert.areEqual(-1, view.indexOf("d"));
  }

  @TestMethod
  public getThrowsForAnIndexOutsideItsList(): void {
    const view = new List(["a"]).asReadOnly();

    const exception = Assert.throws(() => view.get(1), ArgumentOutOfRangeException);

    Assert.areEqual("index", exception.parameterName);
  }

  @TestMethod
  public countsAllOrTheMatchingItemsOfItsList(): void {
    const view = new List([1, 2, 3]).asReadOnly();

    Assert.areEqual(3, view.count());
    Assert.areEqual(1, view.count(t => t > 2));
  }

  @TestMethod
  public showsLaterChangesToItsList(): void {
    const list = new List([1]);
    const view = list.asReadOnly();

    list.add(2);

    Assert.areEqual(2, view.count());
    Assert.areEqual(2, view.get(1));
    Assert.areEqual("[1,2]", JSON.stringify(view.toArray()));
  }

  @TestMethod
  public enumeratesWithTheChecksOfItsList(): void {
    const list = new List([1, 2]);
    const view = list.asReadOnly();
    const enumerateWhileAdding = (): void => {
      for (const item of view)
        list.add(item);
    };

    Assert.throws(enumerateWhileAdding, InvalidOperationException);
  }

  @TestMethod
  public cannotBeTurnedBackIntoTheList(): void {
    const view = new List([1]).asReadOnly();

    Assert.isFalse(view instanceof List);
    Assert.isFalse("add" in view);
    Assert.isInstanceOf(view, Enumerable);
  }
}
