/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IEqualityComparer } from "../interfaces/i-equality-comparer.js";
import { Dictionary } from "../models/dictionary.js";
import { Enumerable, QueryEnumerable } from "../models/enumerable.js";
import { Grouping } from "../models/grouping.js";
import { HashSet } from "../models/hash-set.js";
import { HashTable } from "../models/hash-table.js";
import { KeyValuePair } from "../models/key-value-pair.js";
import { List } from "../models/list.js";
import { OrderedEnumerable } from "../models/ordered-enumerable.js";
import { Comparer } from "../services/comparer.js";
import type { Comparison } from "../types/comparison.js";

declare module "../models/enumerable.js" {
  interface Enumerable<T> {
    orderBy<TKey>(key: (item: T) => TKey, comparison?: Comparison<TKey>): OrderedEnumerable<T>;
    orderByDescending<TKey>(key: (item: T) => TKey, comparison?: Comparison<TKey>): OrderedEnumerable<T>;
    groupBy<TKey>(key: (item: T) => TKey, comparer?: IEqualityComparer<TKey>): Enumerable<Grouping<TKey, T>>;
    toList<TItem extends {} | null>(this: Enumerable<TItem>): List<TItem>;
    toHashSet(comparer?: IEqualityComparer<T>): HashSet<T>;
    toDictionary<TKey, TValue extends {} | null>(key: (item: T) => TKey, value: (item: T) => TValue, comparer?: IEqualityComparer<TKey>): Dictionary<TKey, TValue>;
  }
}

Enumerable.prototype.orderBy = function <T, TKey>(this: Enumerable<T>, key: (item: T) => TKey, comparison: Comparison<TKey> = Comparer.compare): OrderedEnumerable<T> {
  return new OrderedEnumerable<T>(this, [OrderedEnumerable.by(key, comparison)]);
};

Enumerable.prototype.orderByDescending = function <T, TKey>(this: Enumerable<T>, key: (item: T) => TKey, comparison: Comparison<TKey> = Comparer.compare): OrderedEnumerable<T> {
  return new OrderedEnumerable<T>(this, [OrderedEnumerable.by(key, Comparer.descending(comparison))]);
};

Enumerable.prototype.groupBy = function <T, TKey>(this: Enumerable<T>, key: (item: T) => TKey, comparer?: IEqualityComparer<TKey>): Enumerable<Grouping<TKey, T>> {
  return new QueryEnumerable<Grouping<TKey, T>>(() => Iterator.from(HashTable.groupOf(this, key, comparer))
    .map((group: KeyValuePair<TKey, T[]>): Grouping<TKey, T> => new Grouping<TKey, T>(group.key, group.value)));
};

Enumerable.prototype.toList = function <TItem extends {} | null>(this: Enumerable<TItem>): List<TItem> {
  return new List<TItem>(this);
};

Enumerable.prototype.toHashSet = function <T>(this: Enumerable<T>, comparer?: IEqualityComparer<T>): HashSet<T> {
  return new HashSet<T>(this, comparer);
};

Enumerable.prototype.toDictionary = function <T, TKey, TValue extends {} | null>(
  this: Enumerable<T>,
  key: (item: T) => TKey,
  value: (item: T) => TValue,
  comparer?: IEqualityComparer<TKey>): Dictionary<TKey, TValue> {
  return new Dictionary<TKey, TValue>(this.select((item: T): KeyValuePair<TKey, TValue> => new KeyValuePair<TKey, TValue>(key(item), value(item))), comparer);
};
