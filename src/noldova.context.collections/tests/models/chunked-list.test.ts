/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ChunkedList } from "@noldova/context.collections";
import { ArgumentOutOfRangeException, InvalidOperationException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { WalkedChunkedList } from "../fixtures/walked-chunked-list.fixture.js";

@TestClass
export class ChunkedListTests {
  @TestMethod
  public startsEmptyByDefault(): void {
    const list = new ChunkedList<number>(4, 0);

    Assert.areEqual(0, list.count());
    Assert.areEqual(0, list.totalWeight);
    Assert.areEqual("[]", JSON.stringify(list.toArray()));
  }

  @TestMethod
  public startsWithItsLengthOfFillValues(): void {
    const list = new ChunkedList<string>(4, "a", 10);

    Assert.areEqual(10, list.count());
    Assert.areEqual("aaaaaaaaaa", list.toArray().join(""));
  }

  @TestMethod
  public holdsAFillListOfABillionWithoutStorage(): void {
    const list = new ChunkedList<number>(1_000_000, 1, 1_000_000_000, t => t);

    list.set(999_999_999, 0);

    Assert.areEqual(1_000_000_000, list.count());
    Assert.areEqual(999_999_999, list.totalWeight);
    Assert.areEqual(500_000_000, list.weightBefore(500_000_000));
    Assert.areEqual(999_999_998, list.previousWeightedIndex(1_000_000_000));
    Assert.areEqual(-1, list.nextWeightedIndex(999_999_999));
  }

  @TestMethod
  public removesMostOfAFillListOfABillionWithoutReadingTheRemovedChunks(): void {
    const list = new ChunkedList<number>(1_000_000, 1, 1_000_000_000, t => t);
    list.set(0, 2);
    list.set(999_999_999, 3);

    list.removeRange(10, 999_999_980);

    Assert.areEqual(20, list.count());
    Assert.areEqual(23, list.totalWeight);
    Assert.areEqual(2, list.get(0));
    Assert.areEqual(1, list.get(10));
    Assert.areEqual(3, list.get(19));
  }

  @TestMethod
  @TestData(0)
  @TestData(-1)
  @TestData(1.5)
  @TestData(Number.NaN)
  public refusesAChunkSizeThatIsNotAPositiveInteger(chunkSize: number): void {
    const exception = Assert.throws(() => new ChunkedList<number>(chunkSize, 0), ArgumentOutOfRangeException);

    Assert.areEqual("chunkSize", exception.parameterName);
    Assert.areEqual<unknown>(chunkSize, exception.actualValue);
  }

  @TestMethod
  @TestData(-1)
  @TestData(1.5)
  public refusesALengthThatIsNotANonNegativeInteger(length: number): void {
    const exception = Assert.throws(() => new ChunkedList<number>(4, 0, length), ArgumentOutOfRangeException);

    Assert.areEqual("length", exception.parameterName);
    Assert.areEqual<unknown>(length, exception.actualValue);
  }

  @TestMethod
  @TestData(-1)
  @TestData(Number.NaN)
  @TestData(Number.POSITIVE_INFINITY)
  public refusesAWeightThatIsNotAFiniteNumberThatIsNotNegative(weight: number): void {
    const weigh = (item: number): number => item === 1 ? weight : 0;
    const list = new ChunkedList<number>(2, 0, 3, weigh);
    const changes: readonly (() => void)[] = [
      () => new ChunkedList<number>(2, 1, 3, weigh),
      () => list.set(1, 1),
      () => list.insert(1, 1),
      () => list.addRange([0, 1])
    ];

    for (const change of changes) {
      const exception = Assert.throws(change, ArgumentOutOfRangeException);

      Assert.areEqual("weigh", exception.parameterName);
      Assert.areEqual<unknown>(weight, exception.actualValue);
      Assert.areEqual("An element's weight must be a finite number that isn't negative. (Parameter 'weigh')", exception.message);
    }
    Assert.areEqual("0,0,0", list.toArray().join(","));
    Assert.areEqual(0, list.totalWeight);
  }

  @TestMethod
  public getAndTryGetReadEveryChunk(): void {
    const list = ChunkedListTests.numbered(10, 3);

    Assert.areEqual("0,1,2,3,4,5,6,7,8,9", Array.from({ length: 10 }, (_, t) => list.get(t)).join(","));
    Assert.areEqual(9, list.tryGet(9));
  }

  @TestMethod
  public getReturnsANullItem(): void {
    const list = new ChunkedList<string | null>(2, null, 3);

    list.set(1, "a");

    Assert.isNull(list.get(0));
    Assert.isNull(list.tryGet(2));
    Assert.areEqual("a", list.get(1));
  }

  @TestMethod
  @TestData(-1)
  @TestData(10)
  @TestData(1.5)
  @TestData(Number.NaN)
  public getThrowsAndTryGetReturnsUndefinedForAnIndexOutsideTheList(index: number): void {
    const list = ChunkedListTests.numbered(10, 3);

    const exception = Assert.throws(() => list.get(index), ArgumentOutOfRangeException);

    Assert.areEqual("The argument must be within the valid range. (Parameter 'index')", exception.message);
    Assert.areEqual("index", exception.parameterName);
    Assert.areEqual<unknown>(index, exception.actualValue);
    Assert.isUndefined(list.tryGet(index));
  }

  @TestMethod
  public setReplacesAnItemAndItsWeight(): void {
    const list = new ChunkedList<number>(3, 0, 7, t => t);

    list.set(4, 5);
    list.set(4, 2);
    list.set(6, 1);

    Assert.areEqual("0,0,0,0,2,0,1", list.toArray().join(","));
    Assert.areEqual(3, list.totalWeight);
  }

  @TestMethod
  @TestData(-1)
  @TestData(7)
  @TestData(1.5)
  public setThrowsForAnIndexOutsideTheList(index: number): void {
    const list = new ChunkedList<number>(3, 0, 7);

    const exception = Assert.throws(() => list.set(index, 1), ArgumentOutOfRangeException);

    Assert.areEqual("index", exception.parameterName);
    Assert.areEqual<unknown>(index, exception.actualValue);
  }

  @TestMethod
  public changesItsItemsAsAnArrayWould(): void {
    const list = new ChunkedList<number>(3, 0, 8, t => t);
    const reference = new Array<number>(8).fill(0);

    list.set(2, 2);
    reference[2] = 2;
    list.insertRange(1, [10, 11, 12, 13, 14]);
    reference.splice(1, 0, 10, 11, 12, 13, 14);
    list.insert(0, 20);
    reference.splice(0, 0, 20);
    list.add(30);
    reference.push(30);
    list.addRange([31, 32]);
    reference.push(31, 32);
    list.removeAt(3);
    reference.splice(3, 1);
    list.removeRange(2, 6);
    reference.splice(2, 6);
    list.insert(list.count(), 40);
    reference.push(40);

    Assert.areEqual(reference.join(","), list.toArray().join(","));
    Assert.areEqual(reference.length, list.count());
    Assert.areEqual(reference.reduce((sum, t) => sum + t, 0), list.totalWeight);
    Assert.areEqual(reference.join(","), Array.from({ length: reference.length }, (_, t) => list.get(t)).join(","));
  }

  @TestMethod
  public emptiesAndFillsAgain(): void {
    const list = new ChunkedList<number>(2, 0, 5, t => t);

    list.removeRange(0, 5);
    Assert.areEqual(0, list.count());

    list.add(4);
    list.insertRange(0, [1, 2, 3]);

    Assert.areEqual("1,2,3,4", list.toArray().join(","));
    Assert.areEqual(10, list.totalWeight);
  }

  @TestMethod
  @TestData(-1)
  @TestData(4)
  @TestData(1.5)
  public insertThrowsForAPositionOutsideTheList(index: number): void {
    const list = new ChunkedList<number>(2, 0, 3);

    const exception = Assert.throws(() => list.insert(index, 1), ArgumentOutOfRangeException);

    Assert.areEqual("index", exception.parameterName);
    Assert.areEqual<unknown>(index, exception.actualValue);
    Assert.areEqual(3, list.count());
  }

  @TestMethod
  @TestData(-1)
  @TestData(3)
  public removeAtThrowsForAnIndexOutsideTheList(index: number): void {
    const list = new ChunkedList<number>(2, 0, 3);

    const exception = Assert.throws(() => list.removeAt(index), ArgumentOutOfRangeException);

    Assert.areEqual("index", exception.parameterName);
    Assert.areEqual(3, list.count());
  }

  @TestMethod
  @TestData(-1, "index")
  @TestData(4, "index")
  @TestData(1.5, "index")
  public removeRangeThrowsForAPositionOutsideTheList(index: number, parameterName: string): void {
    const exception = Assert.throws(() => new ChunkedList<number>(2, 0, 3).removeRange(index, 0), ArgumentOutOfRangeException);

    Assert.areEqual(parameterName, exception.parameterName);
  }

  @TestMethod
  @TestData(-1)
  @TestData(1.5)
  @TestData(3)
  public removeRangeThrowsForACountThatIsNotInTheList(count: number): void {
    const list = new ChunkedList<number>(2, 0, 3);

    const exception = Assert.throws(() => list.removeRange(1, count), ArgumentOutOfRangeException);

    Assert.areEqual("count", exception.parameterName);
    Assert.areEqual<unknown>(count, exception.actualValue);
    Assert.areEqual(3, list.count());
  }

  @TestMethod
  public removeTakesOutTheFirstEqualItem(): void {
    const list = new ChunkedList<number>(2, 0, 4);
    list.set(1, 5);
    list.set(3, 5);

    Assert.isTrue(list.remove(5));
    Assert.isFalse(list.remove(7));
    Assert.areEqual("0,0,5", list.toArray().join(","));
  }

  @TestMethod
  public removeAllTakesOutTheMatchingItemsAndCountsThem(): void {
    const list = ChunkedListTests.numbered(7, 3);

    Assert.areEqual(4, list.removeAll(t => t % 2 === 0));
    Assert.areEqual("1,3,5", list.toArray().join(","));
    Assert.areEqual(9, list.totalWeight);
  }

  @TestMethod
  public clearRemovesEveryItemAndItsWeight(): void {
    const list = ChunkedListTests.numbered(7, 3);

    list.clear();

    Assert.areEqual(0, list.count());
    Assert.areEqual(0, list.totalWeight);
    Assert.areEqual(-1, list.nextWeightedIndex(0));
  }

  @TestMethod
  public findsTheFirstAndLastEqualItemInFillAndWrittenChunks(): void {
    const list = new ChunkedList<number>(3, 0, 9);
    list.set(4, Number.NaN);
    list.set(7, Number.NaN);

    Assert.areEqual(0, list.indexOf(0));
    Assert.areEqual(8, list.lastIndexOf(0));
    Assert.areEqual(4, list.indexOf(Number.NaN));
    Assert.areEqual(7, list.lastIndexOf(Number.NaN));
    Assert.areEqual(-1, list.indexOf(1));
    Assert.areEqual(-1, list.lastIndexOf(1));
  }

  @TestMethod
  public sortsInPlaceKeepingTheOrderOfEqualItems(): void {
    const list = new ChunkedList<string>(2, "", 0, t => t.length);
    list.addRange(["bb", "a", "ccc", "b", "aa"]);

    list.sort();
    Assert.areEqual("a,aa,b,bb,ccc", list.toArray().join(","));

    list.sort((left, right) => left.length - right.length);
    Assert.areEqual("a,b,aa,bb,ccc", list.toArray().join(","));
    Assert.areEqual(9, list.totalWeight);
  }

  @TestMethod
  public binarySearchFindsTheItemOrTheComplementOfItsInsertionPointAcrossChunks(): void {
    const list = ChunkedListTests.numbered(7, 2);

    Assert.areEqual("0,3,6", [0, 3, 6].map(t => list.binarySearch(t)).join(","));
    Assert.areEqual(7, ~list.binarySearch(9));
  }

  @TestMethod
  public binarySearchUsesTheComparison(): void {
    const list = new ChunkedList<string>(2, "");
    list.addRange(["ccc", "bb", "a"]);

    Assert.areEqual(1, list.binarySearch("xx", (left, right) => right.length - left.length));
    Assert.areEqual(3, ~list.binarySearch("", (left, right) => right.length - left.length));
  }

  @TestMethod
  public asReadOnlyFollowsTheListsChanges(): void {
    const list = ChunkedListTests.numbered(3, 2);
    const view = list.asReadOnly();

    list.add(3);

    Assert.areEqual(4, view.count());
    Assert.areEqual(3, view.get(3));
    Assert.areEqual(2, view.indexOf(2));
  }

  @TestMethod
  public enumeratesInOrderAndRunsTheQueryOperators(): void {
    const list = ChunkedListTests.numbered(7, 3);

    Assert.areEqual("0,1,2,3,4,5,6", Array.from(list).join(","));
    Assert.areEqual(3, list.count(t => t > 3));
    Assert.areEqual("1,3,5", list.where(t => t % 2 === 1).toArray().join(","));
  }

  @TestMethod
  public everyChangeEndsAnEnumerationInProgress(): void {
    const changes: readonly ((list: ChunkedList<number>) => void)[] = [
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
      const list = ChunkedListTests.numbered(4, 2);
      const iterator = list[Symbol.iterator]();
      iterator.next();

      change(list);

      const exception = Assert.throws(() => iterator.next(), InvalidOperationException);
      Assert.areEqual("The collection was changed while it was being enumerated.", exception.message);
    }
  }

  @TestMethod
  public sumsTheWeightBeforeEachPosition(): void {
    const list = ChunkedListTests.weighted();

    Assert.areEqual("0,0,2,2,2,7,7,8", [0, 1, 2, 3, 6, 7, 9, 10].map(t => list.weightBefore(t)).join(","));
    Assert.areEqual(8, list.totalWeight);
  }

  @TestMethod
  public findsTheNextWeightedItemSkippingChunksOfNoWeight(): void {
    const list = ChunkedListTests.weighted();

    Assert.areEqual("1,1,6,6,9,9,-1", [0, 1, 2, 6, 7, 9, 10].map(t => list.nextWeightedIndex(t)).join(","));
  }

  @TestMethod
  public findsThePreviousWeightedItemSkippingChunksOfNoWeight(): void {
    const list = ChunkedListTests.weighted();

    Assert.areEqual("-1,-1,1,1,6,6,9", [0, 1, 2, 6, 7, 9, 10].map(t => list.previousWeightedIndex(t)).join(","));
  }

  @TestMethod
  public weighsAFillChunkByItsFillValue(): void {
    const list = new ChunkedList<number>(4, 1, 10, t => t);

    list.set(5, 0);

    Assert.areEqual(9, list.totalWeight);
    Assert.areEqual(3, list.weightBefore(3));
    Assert.areEqual(6, list.nextWeightedIndex(5));
    Assert.areEqual(4, list.previousWeightedIndex(6));
  }

  @TestMethod
  public weighsNothingWithoutAWeight(): void {
    const list = ChunkedListTests.numbered(5, 2, false);

    Assert.areEqual(0, list.totalWeight);
    Assert.areEqual(0, list.weightBefore(5));
    Assert.areEqual(-1, list.nextWeightedIndex(0));
    Assert.areEqual(-1, list.previousWeightedIndex(5));
  }

  @TestMethod
  public weighsAnEmptyList(): void {
    const list = new ChunkedList<number>(4, 1, 0, t => t);

    Assert.areEqual(0, list.weightBefore(0));
    Assert.areEqual(-1, list.nextWeightedIndex(0));
    Assert.areEqual(-1, list.previousWeightedIndex(0));
  }

  @TestMethod
  @TestData(-1)
  @TestData(11)
  @TestData(1.5)
  public theWeightQueriesThrowForAPositionOutsideTheList(index: number): void {
    const list = ChunkedListTests.weighted();
    const queries: readonly ((position: number) => number)[] = [
      t => list.weightBefore(t),
      t => list.nextWeightedIndex(t),
      t => list.previousWeightedIndex(t)
    ];

    for (const query of queries) {
      const exception = Assert.throws(() => query(index), ArgumentOutOfRangeException);

      Assert.areEqual("index", exception.parameterName);
      Assert.areEqual<unknown>(index, exception.actualValue);
    }
  }

  private static numbered(length: number, chunkSize: number, weighted: boolean = true): ChunkedList<number> {
    const list = weighted ? new ChunkedList<number>(chunkSize, 0, 0, t => t) : new ChunkedList<number>(chunkSize, 0);
    list.addRange(Array.from({ length }, (_, t) => t));

    return list;
  }

  private static weighted(): ChunkedList<number> {
    const list = new ChunkedList<number>(3, 0, 10, t => t);
    list.set(1, 2);
    list.set(6, 5);
    list.set(9, 1);

    return list;
  }

  @TestMethod
  public readsTheLastAndAnyPositionWithoutWalking(): void {
    const list = ChunkedListTests.walkedListOf([1, 2, 3]);

    Assert.areEqual(3, list.last());
    Assert.areEqual(3, list.lastOrDefault());
    Assert.areEqual(2, list.elementAt(1));
    Assert.areEqual(2, list.elementAtOrDefault(1));
    Assert.areEqual(0, list.walks);
  }

  @TestMethod
  public keepsTheLastAndThePositionResultsAtTheEdges(): void {
    const empty = new ChunkedList<number>(2, 0);
    const list = ChunkedListTests.walkedListOf([1, 2, 3]);

    Assert.throws(() => empty.last(), InvalidOperationException);
    Assert.isUndefined(empty.lastOrDefault());
    Assert.areEqual(2, list.last(t => t < 3));
    Assert.areEqual(2, list.lastOrDefault(t => t < 3));
    Assert.throws(() => list.elementAt(3), ArgumentOutOfRangeException);
    Assert.throws(() => list.elementAt(-1), ArgumentOutOfRangeException);
    Assert.throws(() => list.elementAt(1.5), ArgumentOutOfRangeException);
    Assert.isUndefined(list.elementAtOrDefault(3));
    Assert.isUndefined(list.elementAtOrDefault(-1));
    Assert.isUndefined(list.elementAtOrDefault(1.5));
  }

  private static walkedListOf(items: readonly number[]): WalkedChunkedList<number> {
    const list = new WalkedChunkedList<number>(2, 0);
    for (const item of items)
      list.add(item);

    return list;
  }
}
