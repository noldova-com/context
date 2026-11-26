/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import { ArgumentOutOfRangeException, InvalidOperationException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class ListTests {
  @TestMethod
  public startsEmptyByDefault(): void {
    Assert.areEqual(0, new List<number>().count());
  }

  @TestMethod
  public copiesTheItemsItIsGiven(): void {
    const source = [1, 2];
    const list = new List(source);

    source.push(3);

    Assert.areEqual("[1,2]", JSON.stringify(list.toArray()));
  }

  @TestMethod
  public countsAllOrTheMatchingItems(): void {
    const list = new List([1, 2, 3]);

    Assert.areEqual(3, list.count());
    Assert.areEqual(2, list.count(t => t > 1));
  }

  @TestMethod
  public getReturnsTheItemAtTheIndex(): void {
    const list = new List(["a", "b", "c"]);

    Assert.areEqual("a", list.get(0));
    Assert.areEqual("c", list.get(2));
  }

  @TestMethod
  public getReturnsANullItem(): void {
    Assert.isNull(new List<string | null>(["a", null]).get(1));
  }

  @TestMethod
  @TestData(-1)
  @TestData(3)
  @TestData(1.5)
  public getThrowsForAnIndexOutsideTheList(index: number): void {
    const exception = Assert.throws(() => new List(["a", "b", "c"]).get(index), ArgumentOutOfRangeException);

    Assert.areEqual("The argument must be within the valid range. (Parameter 'index')", exception.message);
    Assert.areEqual("index", exception.parameterName);
    Assert.areEqual<unknown>(index, exception.actualValue);
  }

  @TestMethod
  public tryGetReturnsUndefinedOutsideTheList(): void {
    const list = new List(["a", "b"]);

    Assert.areEqual("b", list.tryGet(1));
    Assert.isUndefined(list.tryGet(2));
    Assert.isUndefined(list.tryGet(-1));
  }

  @TestMethod
  public setReplacesTheItemAtTheIndex(): void {
    const list = new List(["a", "b"]);

    list.set(1, "c");

    Assert.areEqual("[\"a\",\"c\"]", JSON.stringify(list.toArray()));
  }

  @TestMethod
  public setThrowsForAnIndexOutsideTheListAndLeavesItUnchanged(): void {
    const list = new List(["a", "b"]);

    const exception = Assert.throws(() => list.set(2, "c"), ArgumentOutOfRangeException);

    Assert.areEqual("index", exception.parameterName);
    Assert.areEqual("[\"a\",\"b\"]", JSON.stringify(list.toArray()));
  }

  @TestMethod
  public addAppendsTheItem(): void {
    const list = new List([1]);

    list.add(2);

    Assert.areEqual("[1,2]", JSON.stringify(list.toArray()));
  }

  @TestMethod
  public addRangeAppendsTheItemsInOrder(): void {
    const list = new List([1]);

    list.addRange([2, 3]);

    Assert.areEqual("[1,2,3]", JSON.stringify(list.toArray()));
  }

  @TestMethod
  public addRangeOfTheListItselfAppendsACopy(): void {
    const list = new List([1, 2]);

    list.addRange(list);

    Assert.areEqual("[1,2,1,2]", JSON.stringify(list.toArray()));
  }

  @TestMethod
  public insertPutsTheItemAtThePosition(): void {
    const list = new List([1, 3]);

    list.insert(1, 2);
    list.insert(0, 0);
    list.insert(4, 4);

    Assert.areEqual("[0,1,2,3,4]", JSON.stringify(list.toArray()));
  }

  @TestMethod
  @TestData(-1)
  @TestData(3)
  @TestData(0.5)
  public insertThrowsForAPositionOutsideTheListAndLeavesItUnchanged(index: number): void {
    const list = new List([1, 2]);

    const exception = Assert.throws(() => list.insert(index, 9), ArgumentOutOfRangeException);

    Assert.areEqual("index", exception.parameterName);
    Assert.areEqual<unknown>(index, exception.actualValue);
    Assert.areEqual("[1,2]", JSON.stringify(list.toArray()));
  }

  @TestMethod
  public insertRangePutsTheItemsInOrderAtThePosition(): void {
    const list = new List([1, 4]);

    list.insertRange(1, [2, 3]);

    Assert.areEqual("[1,2,3,4]", JSON.stringify(list.toArray()));
  }

  @TestMethod
  public insertRangeOfTheListItselfInsertsACopy(): void {
    const list = new List([1, 2]);

    list.insertRange(1, list);

    Assert.areEqual("[1,1,2,2]", JSON.stringify(list.toArray()));
  }

  @TestMethod
  public insertRangeThrowsForAPositionOutsideTheList(): void {
    const list = new List([1, 2]);

    const exception = Assert.throws(() => list.insertRange(3, [9]), ArgumentOutOfRangeException);

    Assert.areEqual("index", exception.parameterName);
    Assert.areEqual("[1,2]", JSON.stringify(list.toArray()));
  }

  @TestMethod
  public removeRemovesTheFirstEqualItem(): void {
    const list = new List([1, Number.NaN, 1]);

    Assert.isTrue(list.remove(1));
    Assert.isTrue(list.remove(Number.NaN));
    Assert.areEqual("[1]", JSON.stringify(list.toArray()));
  }

  @TestMethod
  public removeReturnsFalseForAMissingItem(): void {
    const list = new List([1, 2]);

    Assert.isFalse(list.remove(3));
    Assert.areEqual("[1,2]", JSON.stringify(list.toArray()));
  }

  @TestMethod
  public removeAtRemovesTheItemAtTheIndex(): void {
    const list = new List([1, 2, 3]);

    list.removeAt(1);

    Assert.areEqual("[1,3]", JSON.stringify(list.toArray()));
  }

  @TestMethod
  @TestData(-1)
  @TestData(3)
  @TestData(0.5)
  public removeAtThrowsForAnIndexOutsideTheList(index: number): void {
    const list = new List([1, 2, 3]);

    const exception = Assert.throws(() => list.removeAt(index), ArgumentOutOfRangeException);

    Assert.areEqual("index", exception.parameterName);
    Assert.areEqual("[1,2,3]", JSON.stringify(list.toArray()));
  }

  @TestMethod
  public removeRangeRemovesTheCountOfItemsFromTheIndex(): void {
    const list = new List([1, 2, 3, 4]);

    list.removeRange(1, 2);

    Assert.areEqual("[1,4]", JSON.stringify(list.toArray()));
  }

  @TestMethod
  public removeRangeOfNoItemsAcceptsTheEndPosition(): void {
    const list = new List([1, 2]);

    list.removeRange(2, 0);

    Assert.areEqual("[1,2]", JSON.stringify(list.toArray()));
  }

  @TestMethod
  @TestData(-1, 1, "index")
  @TestData(5, 0, "index")
  @TestData(0.5, 1, "index")
  @TestData(0, 1.5, "count")
  @TestData(0, -1, "count")
  @TestData(3, 2, "count")
  public removeRangeThrowsForARangeOutsideTheList(index: number, count: number, parameterName: string): void {
    const list = new List([1, 2, 3, 4]);

    const exception = Assert.throws(() => list.removeRange(index, count), ArgumentOutOfRangeException);

    Assert.areEqual(parameterName, exception.parameterName);
    Assert.areEqual("[1,2,3,4]", JSON.stringify(list.toArray()));
  }

  @TestMethod
  public removeAllRemovesTheMatchingItemsAndCountsThem(): void {
    const list = new List([1, 2, 3, 4]);

    Assert.areEqual(2, list.removeAll(t => t % 2 === 0));
    Assert.areEqual(0, list.removeAll(t => t > 5));
    Assert.areEqual("[1,3]", JSON.stringify(list.toArray()));
  }

  @TestMethod
  public clearRemovesEveryItem(): void {
    const list = new List([1, 2]);

    list.clear();

    Assert.areEqual(0, list.count());
    Assert.areEqual("[]", JSON.stringify(list.toArray()));
  }

  @TestMethod
  public indexOfFindsTheFirstEqualItem(): void {
    const list = new List([1, Number.NaN, 1, -0]);

    Assert.areEqual(0, list.indexOf(1));
    Assert.areEqual(1, list.indexOf(Number.NaN));
    Assert.areEqual(3, list.indexOf(0));
    Assert.areEqual(-1, list.indexOf(2));
  }

  @TestMethod
  public lastIndexOfFindsTheLastEqualItem(): void {
    const list = new List([1, Number.NaN, 1]);

    Assert.areEqual(2, list.lastIndexOf(1));
    Assert.areEqual(1, list.lastIndexOf(Number.NaN));
    Assert.areEqual(-1, list.lastIndexOf(2));
  }

  @TestMethod
  public sortOrdersTheItemsWithTheDefaultComparer(): void {
    const numbers = new List([3, 10, 2]);
    const texts = new List(["b", "C", "a"]);

    numbers.sort();
    texts.sort();

    Assert.areEqual("[2,3,10]", JSON.stringify(numbers.toArray()));
    Assert.areEqual("[\"C\",\"a\",\"b\"]", JSON.stringify(texts.toArray()));
  }

  @TestMethod
  public sortUsesTheComparisonAndKeepsEqualItemsInOrder(): void {
    const list = new List(["bb", "a", "cc", "b"]);

    list.sort((left, right) => left.length - right.length);

    Assert.areEqual("[\"a\",\"b\",\"bb\",\"cc\"]", JSON.stringify(list.toArray()));
  }

  @TestMethod
  public binarySearchFindsTheItemOrTheComplementOfItsInsertionPoint(): void {
    const list = new List([1, 3, 5, 7]);

    Assert.areEqual(2, list.binarySearch(5));
    Assert.areEqual(2, ~list.binarySearch(4));
    Assert.areEqual(4, ~list.binarySearch(8));
  }

  @TestMethod
  public binarySearchUsesTheComparison(): void {
    const list = new List(["ccc", "bb", "a"]);

    Assert.areEqual(1, list.binarySearch("xx", (left, right) => right.length - left.length));
    Assert.areEqual(0, ~list.binarySearch("xxxx", (left, right) => right.length - left.length));
  }

  @TestMethod
  public enumeratesTheItemsInOrder(): void {
    const items: number[] = [];

    for (const item of new List([3, 1, 2]))
      items.push(item);

    Assert.areEqual("[3,1,2]", JSON.stringify(items));
  }

  @TestMethod
  public changingTheListWhileEnumeratingItThrows(): void {
    const list = new List([1, 2, 3]);
    const enumerateWhileAdding = (): void => {
      for (const item of list)
        list.add(item);
    };

    const exception = Assert.throws(enumerateWhileAdding, InvalidOperationException);

    Assert.areEqual("The collection was changed while it was being enumerated.", exception.message);
    Assert.areEqual("[1,2,3,1]", JSON.stringify(list.toArray()));
  }

  @TestMethod
  public everyChangeEndsAnEnumerationInProgress(): void {
    const changes: readonly ((list: List<number>) => void)[] = [
      t => t.set(0, 9),
      t => t.add(9),
      t => t.addRange([9]),
      t => t.insert(0, 9),
      t => t.insertRange(0, [9]),
      t => t.remove(1),
      t => t.removeAt(0),
      t => t.removeRange(0, 1),
      t => t.removeAll(() => false),
      t => t.sort(),
      t => t.clear()
    ];

    for (const change of changes) {
      const list = new List([1, 2]);
      const iterator = list[Symbol.iterator]();
      iterator.next();

      change(list);

      Assert.throws(() => iterator.next(), InvalidOperationException);
    }
  }

  @TestMethod
  public readingTheListWhileEnumeratingItDoesNotThrow(): void {
    const list = new List([1, 2]);
    const seen: number[] = [];

    for (const item of list)
      seen.push(list.indexOf(item), list.get(0), list.count());

    Assert.areEqual("[0,1,2,1,1,2]", JSON.stringify(seen));
  }
}
