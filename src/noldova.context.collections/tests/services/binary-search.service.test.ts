/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BinarySearchService, Comparer, List } from "@noldova/context.collections";
import { ArgumentException, ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class BinarySearchServiceTests {
  @TestMethod
  public findsTheExactValue(): void {
    Assert.areEqual(2, BinarySearchService.floorIndex([1, 3, 5, 7], 5));
  }

  @TestMethod
  public findsTheNearestLowerValue(): void {
    Assert.areEqual(1, BinarySearchService.floorIndex([1, 3, 5, 7], 4));
  }

  @TestMethod
  public returnsTheLastDuplicate(): void {
    Assert.areEqual(2, BinarySearchService.floorIndex([1, 3, 3, 5], 3));
  }

  @TestMethod
  public returnsMinusOneBeforeTheFirstValue(): void {
    Assert.areEqual(-1, BinarySearchService.floorIndex([1, 3, 5], 0));
  }

  @TestMethod
  public returnsMinusOneForAnEmptyCollection(): void {
    Assert.areEqual(-1, BinarySearchService.floorIndex([], 5));
  }

  @TestMethod
  public returnsTheLastIndexAfterTheLastValue(): void {
    Assert.areEqual(2, BinarySearchService.floorIndex([1, 3, 5], 9));
  }

  @TestMethod
  public searchFindsTheItem(): void {
    Assert.areEqual("0,2,3", [1, 5, 7].map(t => BinarySearchService.search([1, 3, 5, 7], t)).join(","));
  }

  @TestMethod
  public searchReturnsTheComplementOfTheInsertionPointOnAMiss(): void {
    Assert.areEqual("0,2,4", [0, 4, 9].map(t => ~BinarySearchService.search([1, 3, 5, 7], t)).join(","));
    Assert.areEqual(0, ~BinarySearchService.search<number>([], 5));
  }

  @TestMethod
  public searchUsesTheComparison(): void {
    const words = ["a", "bb", "ccc"];
    const byLength = (left: string, right: string): number => left.length - right.length;

    Assert.areEqual(1, BinarySearchService.search(words, "xx", byLength));
    Assert.areEqual(3, ~BinarySearchService.search(words, "xxxx", byLength));
  }

  @TestMethod
  public searchReadsAReadOnlyList(): void {
    const list = new List([1, 3, 5, 7]);

    Assert.areEqual(2, BinarySearchService.search(list, 5));
    Assert.areEqual(2, ~BinarySearchService.search(list, 4));
  }

  @TestMethod
  public searchLooksOnlyInTheRange(): void {
    const items = [1, 3, 5, 7, 9];

    Assert.areEqual(2, ~BinarySearchService.search(items, 7, Comparer.compare, 0, 2));
    Assert.areEqual(2, ~BinarySearchService.search(items, 1, Comparer.compare, 2));
    Assert.areEqual(3, BinarySearchService.search(items, 7, Comparer.compare, 2));
    Assert.areEqual(4, ~BinarySearchService.search(items, 9, Comparer.compare, 4, 0));
  }

  @TestMethod
  public theBoundsSurroundTheEqualItems(): void {
    const items = [1, 3, 3, 3, 5];

    Assert.areEqual("0,1,4,4,5", [0, 3, 4, 5, 6].map(t => BinarySearchService.lowerBound(items, t)).join(","));
    Assert.areEqual("0,4,4,5,5", [0, 3, 4, 5, 6].map(t => BinarySearchService.upperBound(items, t)).join(","));
  }

  @TestMethod
  public theBoundsOfAnEmptyCollectionAreItsStart(): void {
    Assert.areEqual(0, BinarySearchService.lowerBound<number>([], 5));
    Assert.areEqual(0, BinarySearchService.upperBound<number>([], 5));
  }

  @TestMethod
  public theBoundsUseTheComparison(): void {
    const words = ["ccc", "bb", "aa", "a"];
    const longestFirst = (left: string, right: string): number => right.length - left.length;

    Assert.areEqual(1, BinarySearchService.lowerBound(words, "xx", longestFirst));
    Assert.areEqual(3, BinarySearchService.upperBound(words, "xx", longestFirst));
  }

  @TestMethod
  public theBoundsByAKeyCompareTheSelectedKeys(): void {
    const words = new List(["a", "bb", "cc", "ddd"]);

    Assert.areEqual(1, BinarySearchService.lowerBoundBy(words, 2, t => t.length));
    Assert.areEqual(3, BinarySearchService.upperBoundBy(words, 2, t => t.length));
    Assert.areEqual(4, BinarySearchService.upperBoundBy(words, -3, t => -t.length, (left, right) => right - left));
  }

  @TestMethod
  public theBoundsLookOnlyInTheRange(): void {
    const items = [3, 3, 3, 3, 3];

    Assert.areEqual(1, BinarySearchService.lowerBound(items, 3, Comparer.compare, 1, 2));
    Assert.areEqual(3, BinarySearchService.upperBound(items, 3, Comparer.compare, 1, 2));
    Assert.areEqual(2, BinarySearchService.lowerBoundBy(items, 3, t => t, Comparer.compare, 2));
    Assert.areEqual(5, BinarySearchService.upperBoundBy(items, 3, t => t, Comparer.compare, 2));
  }

  @TestMethod
  @TestData(-1, 0, "index")
  @TestData(1.5, 0, "index")
  @TestData(5, 0, "index")
  @TestData(0, -1, "count")
  @TestData(0, 1.5, "count")
  @TestData(2, 3, "count")
  public eachSearchThrowsForARangeOutsideTheItems(index: number, count: number, parameterName: string): void {
    const items = new List([1, 3, 5, 7]);
    const searches: readonly (() => number)[] = [
      () => BinarySearchService.search(items, 3, Comparer.compare, index, count),
      () => BinarySearchService.lowerBound(items, 3, Comparer.compare, index, count),
      () => BinarySearchService.upperBound(items, 3, Comparer.compare, index, count),
      () => BinarySearchService.lowerBoundBy(items, 3, t => t, Comparer.compare, index, count),
      () => BinarySearchService.upperBoundBy(items, 3, t => t, Comparer.compare, index, count)
    ];

    for (const search of searches) {
      const exception = Assert.throws(search, ArgumentOutOfRangeException);

      Assert.areEqual(parameterName, exception.parameterName);
      Assert.areEqual<unknown>(parameterName === "index" ? index : count, exception.actualValue);
    }
  }

  @TestMethod
  public eachSearchThrowsForAHoleInTheItems(): void {
    const items = new Array<number>(3);
    items[0] = 1;
    const searches: readonly (() => number)[] = [
      () => BinarySearchService.search(items, 3),
      () => BinarySearchService.lowerBound(items, 3),
      () => BinarySearchService.upperBound(items, 3),
      () => BinarySearchService.lowerBoundBy(items, 3, t => t),
      () => BinarySearchService.upperBoundBy(items, 3, t => t)
    ];

    for (const search of searches) {
      const exception = Assert.throws(search, ArgumentException);

      Assert.areEqual("The sorted items have no element at a position the search reads. (Parameter 'items')", exception.message);
      Assert.areEqual("items", exception.parameterName);
    }
  }
}
