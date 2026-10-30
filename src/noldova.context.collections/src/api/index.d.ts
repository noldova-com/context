/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Provides binary-search operations for ascending numeric arrays.
 */
export declare class BinarySearchService {
  /**
   * Finds the last array position whose value is less than or equal to the target.
   *
   * @param values The numbers to search, sorted from smallest to greatest.
   * Equal consecutive values are allowed.
   * @param target The inclusive comparison limit. An exact match is not required;
   * when none exists, the search finds the nearest lower value.
   * @returns The zero-based index of the last qualifying value. If that value
   * occurs more than once, returns its last index. Returns `-1` when no value
   * qualifies, including an empty array or a target below the first value.
   *
   * @remarks
   * Ordering is a caller precondition and is not checked. The method does not sort,
   * modify, copy, or retain the array. It performs O(log n) comparisons and uses
   * O(1) additional storage, where n is the number of values.
   *
   * @example
   * ```ts
   * BinarySearchService.floorIndex([1, 3, 5, 7], 5); // 2: exact match.
   * BinarySearchService.floorIndex([1, 3, 5, 7], 4); // 1: the nearest lower value is 3.
   * BinarySearchService.floorIndex([1, 3, 3, 5], 3); // 2: the last duplicate.
   * BinarySearchService.floorIndex([1, 3, 5], 9); // 2: the last value is below the target.
   * BinarySearchService.floorIndex([1, 3, 5], 0); // -1: all values exceed the target.
   * BinarySearchService.floorIndex([], 5); // -1: the array is empty.
   * ```
   */
  public static floorIndex(values: readonly number[], target: number): number;
}
