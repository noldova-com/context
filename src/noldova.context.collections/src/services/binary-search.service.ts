/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { ArgumentException, ArgumentOutOfRangeException } from "@noldova/context.exceptions";

import type { IReadOnlyList } from "../interfaces/i-read-only-list.js";
import { Enumerable } from "../models/enumerable.js";
import { Resources } from "../resources.js";
import type { Comparison } from "../types/comparison.js";
import { Comparer } from "./comparer.js";

export class BinarySearchService {
  public static floorIndex(values: readonly number[], target: number): number {
    let lowerIndex = 0;
    let upperIndex = values.length - 1;

    while (lowerIndex <= upperIndex) {
      const middleIndex = lowerIndex + ((upperIndex - lowerIndex) >>> 1);
      const value = values[middleIndex];
      if (Object.isUndefined(value) || value > target)
        upperIndex = middleIndex - 1;
      else
        lowerIndex = middleIndex + 1;
    }

    return upperIndex;
  }

  public static search<T extends {} | null>(items: readonly T[] | IReadOnlyList<T>, item: T, comparison: Comparison<T> = Comparer.compare, index: number = 0,
    count: number = BinarySearchService.countOf(items) - index): number {
    BinarySearchService.throwIfNotRange(items, index, count);
    let lowerIndex = index;
    let upperIndex = index + count - 1;

    while (lowerIndex <= upperIndex) {
      const middleIndex = lowerIndex + ((upperIndex - lowerIndex) >>> 1);
      const order = comparison(BinarySearchService.itemAt(items, middleIndex), item);
      if (order === 0)
        return middleIndex;

      if (order < 0)
        lowerIndex = middleIndex + 1;
      else
        upperIndex = middleIndex - 1;
    }

    return ~lowerIndex;
  }

  public static lowerBound<T extends {} | null>(items: readonly T[] | IReadOnlyList<T>, key: T, comparison: Comparison<T> = Comparer.compare, index: number = 0,
    count: number = BinarySearchService.countOf(items) - index): number {
    return BinarySearchService.lowerBoundBy(items, key, t => t, comparison, index, count);
  }

  public static upperBound<T extends {} | null>(items: readonly T[] | IReadOnlyList<T>, key: T, comparison: Comparison<T> = Comparer.compare, index: number = 0,
    count: number = BinarySearchService.countOf(items) - index): number {
    return BinarySearchService.upperBoundBy(items, key, t => t, comparison, index, count);
  }

  public static lowerBoundBy<T extends {} | null, TKey>(items: readonly T[] | IReadOnlyList<T>, key: TKey, select: (item: T) => TKey,
    comparison: Comparison<TKey> = Comparer.compare, index: number = 0, count: number = BinarySearchService.countOf(items) - index): number {
    return BinarySearchService.firstIndexAfter(items, index, count, t => comparison(select(t), key) < 0);
  }

  public static upperBoundBy<T extends {} | null, TKey>(items: readonly T[] | IReadOnlyList<T>, key: TKey, select: (item: T) => TKey,
    comparison: Comparison<TKey> = Comparer.compare, index: number = 0, count: number = BinarySearchService.countOf(items) - index): number {
    return BinarySearchService.firstIndexAfter(items, index, count, t => comparison(select(t), key) <= 0);
  }

  private static firstIndexAfter<T extends {} | null>(items: readonly T[] | IReadOnlyList<T>, index: number, count: number, isBefore: (item: T) => boolean): number {
    BinarySearchService.throwIfNotRange(items, index, count);
    let lowerIndex = index;
    let upperIndex = index + count;

    while (lowerIndex < upperIndex) {
      const middleIndex = lowerIndex + ((upperIndex - lowerIndex) >>> 1);
      if (isBefore(BinarySearchService.itemAt(items, middleIndex)))
        lowerIndex = middleIndex + 1;
      else
        upperIndex = middleIndex;
    }

    return lowerIndex;
  }

  private static countOf<T extends {} | null>(items: readonly T[] | IReadOnlyList<T>): number {
    return items instanceof Enumerable ? items.count() : items.length;
  }

  private static itemAt<T extends {} | null>(items: readonly T[] | IReadOnlyList<T>, index: number): T {
    if (items instanceof Enumerable)
      return items.get(index);

    const item = items[index];
    if (Object.isUndefined(item))
      throw new ArgumentException(Resources.itemMissing, Resources.itemsParameterName);

    return item;
  }

  private static throwIfNotRange<T extends {} | null>(items: readonly T[] | IReadOnlyList<T>, index: number, count: number): void {
    ArgumentOutOfRangeException.throwIfNotInteger(index, Resources.indexParameterName);
    ArgumentOutOfRangeException.throwIfNegative(index, Resources.indexParameterName);
    if (index > BinarySearchService.countOf(items))
      throw new ArgumentOutOfRangeException(Resources.indexParameterName, index);

    ArgumentOutOfRangeException.throwIfNotInteger(count, Resources.countParameterName);
    ArgumentOutOfRangeException.throwIfNegative(count, Resources.countParameterName);
    if (index + count > BinarySearchService.countOf(items))
      throw new ArgumentOutOfRangeException(Resources.countParameterName, count);
  }
}
