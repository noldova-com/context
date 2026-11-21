/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { ArgumentException, KeyNotFoundException } from "@noldova/context.exceptions";

import type { IEqualityComparer } from "../interfaces/i-equality-comparer.js";
import type { IReadOnlyDictionary } from "../interfaces/i-read-only-dictionary.js";
import { Resources } from "../resources.js";
import { EqualityComparers } from "../services/equality-comparers.js";
import { Enumerable } from "./enumerable.js";
import { HashTable } from "./hash-table.js";
import type { KeyValuePair } from "./key-value-pair.js";
import { ReadOnlyDictionary } from "./read-only-dictionary.js";

export class Dictionary<TKey, TValue extends {} | null> extends Enumerable<KeyValuePair<TKey, TValue>>
  implements IReadOnlyDictionary<TKey, TValue> {
  private readonly table: HashTable<TKey, TValue>;

  public constructor(entries: Iterable<KeyValuePair<TKey, TValue>> = [], comparer?: IEqualityComparer<TKey>) {
    super();

    this.table = new HashTable<TKey, TValue>(comparer);
    for (const entry of entries)
      this.add(entry.key, entry.value);
  }

  public override *[Symbol.iterator](): Generator<KeyValuePair<TKey, TValue>> {
    const version = this.table.changes.value;
    for (const entry of this.table) {
      yield entry;
      this.table.changes.throwIfChangedSince(version);
    }
  }

  public override count(predicate?: (item: KeyValuePair<TKey, TValue>) => boolean): number {
    return Object.isUndefined(predicate) ? this.table.size : super.count(predicate);
  }

  public get(key: TKey): TValue {
    const value = this.table.get(key);
    if (Object.isUndefined(value))
      throw new KeyNotFoundException();

    return value;
  }

  public tryGet(key: TKey): TValue | undefined {
    return this.table.get(key);
  }

  public set(key: TKey, value: TValue): void {
    this.table.set(key, value);
  }

  public add(key: TKey, value: TValue): void {
    if (!this.table.tryAdd(key, value))
      throw new ArgumentException(Resources.keyExists, Resources.keyParameterName);
  }

  public tryAdd(key: TKey, value: TValue): boolean {
    return this.table.tryAdd(key, value);
  }

  public remove(key: TKey): boolean {
    return this.table.delete(key);
  }

  public containsKey(key: TKey): boolean {
    return this.table.has(key);
  }

  public containsValue(value: TValue): boolean {
    return this.table.values().some((candidate: TValue): boolean => EqualityComparers.default.equals(candidate, value));
  }

  public keys(): Enumerable<TKey> {
    return this.select((entry: KeyValuePair<TKey, TValue>): TKey => entry.key);
  }

  public values(): Enumerable<TValue> {
    return this.select((entry: KeyValuePair<TKey, TValue>): TValue => entry.value);
  }

  public clear(): void {
    this.table.clear();
  }

  public asReadOnly(): ReadOnlyDictionary<TKey, TValue> {
    return new ReadOnlyDictionary<TKey, TValue>(this);
  }
}
