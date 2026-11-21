/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Comparer } from "../services/comparer.js";
import type { Comparison } from "../types/comparison.js";
import { Enumerable } from "./enumerable.js";
import { SortEntry } from "./sort-entry.js";

export class OrderedEnumerable<T> extends Enumerable<T> {
  private readonly source: Iterable<T>;
  private readonly sorts: readonly ((items: readonly T[]) => T[])[];

  public constructor(source: Iterable<T>, sorts: readonly ((items: readonly T[]) => T[])[]) {
    super();

    this.source = source;
    this.sorts = sorts;
  }

  public static by<T, TKey>(key: (item: T) => TKey, comparison: Comparison<TKey>): (items: readonly T[]) => T[] {
    return (items: readonly T[]): T[] => items
      .map((item: T): SortEntry<T, TKey> => new SortEntry<T, TKey>(item, key(item)))
      .sort((left: SortEntry<T, TKey>, right: SortEntry<T, TKey>): number => comparison(left.key, right.key))
      .map((entry: SortEntry<T, TKey>): T => entry.item);
  }

  public override *[Symbol.iterator](): Generator<T> {
    yield* this.sorts.reduceRight((items: T[], sort: (items: readonly T[]) => T[]): T[] => sort(items), Array.from(this.source));
  }

  public thenBy<TKey>(key: (item: T) => TKey, comparison: Comparison<TKey> = Comparer.compare): OrderedEnumerable<T> {
    return new OrderedEnumerable<T>(this.source, [...this.sorts, OrderedEnumerable.by(key, comparison)]);
  }

  public thenByDescending<TKey>(key: (item: T) => TKey, comparison: Comparison<TKey> = Comparer.compare): OrderedEnumerable<T> {
    return this.thenBy(key, Comparer.descending(comparison));
  }
}
