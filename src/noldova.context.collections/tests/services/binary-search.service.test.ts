/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BinarySearchService } from "@noldova/context.collections";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

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
}
