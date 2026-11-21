/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { IEqualityComparer } from "../interfaces/i-equality-comparer.js";
import { ChangeCounter } from "./change-counter.js";
import { KeyValuePair } from "./key-value-pair.js";

export class HashTable<TKey, TValue extends {} | null> implements Iterable<KeyValuePair<TKey, TValue>> {
  private static readonly MISSING: unique symbol = Symbol("missing");

  private readonly entries: Map<TKey, TValue> = new Map<TKey, TValue>();
  private readonly buckets: Map<number, TKey[]> = new Map<number, TKey[]>();
  private readonly comparer: IEqualityComparer<TKey> | undefined;
  public readonly changes: ChangeCounter = new ChangeCounter();

  public constructor(comparer: IEqualityComparer<TKey> | undefined) {
    this.comparer = comparer;
  }

  public static groupOf<T, TKey>(items: Iterable<T>, key: (item: T) => TKey, comparer: IEqualityComparer<TKey> | undefined): HashTable<TKey, T[]> {
    const groups = new HashTable<TKey, T[]>(comparer);
    for (const item of items) {
      const itemKey = key(item);
      const group = groups.get(itemKey);
      if (Object.isUndefined(group))
        groups.set(itemKey, [item]);
      else
        group.push(item);
    }

    return groups;
  }

  public get size(): number {
    return this.entries.size;
  }

  public *[Symbol.iterator](): Generator<KeyValuePair<TKey, TValue>> {
    for (const [key, value] of this.entries)
      yield new KeyValuePair<TKey, TValue>(key, value);
  }

  public keys(): MapIterator<TKey> {
    return this.entries.keys();
  }

  public values(): MapIterator<TValue> {
    return this.entries.values();
  }

  public get(key: TKey): TValue | undefined {
    const found = this.find(key);

    return found === HashTable.MISSING ? undefined : this.entries.get(found);
  }

  public has(key: TKey): boolean {
    return this.find(key) !== HashTable.MISSING;
  }

  public set(key: TKey, value: TValue): void {
    const found = this.find(key);
    if (found === HashTable.MISSING)
      this.insert(key, value);
    else
      this.entries.set(found, value);
    this.changes.increment();
  }

  public tryAdd(key: TKey, value: TValue): boolean {
    if (this.find(key) !== HashTable.MISSING)
      return false;

    this.insert(key, value);
    this.changes.increment();

    return true;
  }

  public delete(key: TKey): boolean {
    const comparer = this.comparer;
    if (Object.isUndefined(comparer))
      return this.deleteFound(key);

    const hash = comparer.hash(key);
    const bucket = this.buckets.get(hash);
    if (Object.isUndefined(bucket))
      return false;

    let index = 0;
    for (const candidate of bucket) {
      if (comparer.equals(candidate, key)) {
        bucket.splice(index, 1);
        if (bucket.length === 0)
          this.buckets.delete(hash);

        return this.deleteFound(candidate);
      }
      index++;
    }

    return false;
  }

  public clear(): void {
    this.entries.clear();
    this.buckets.clear();
    this.changes.increment();
  }

  private deleteFound(key: TKey): boolean {
    if (!this.entries.delete(key))
      return false;

    this.changes.increment();

    return true;
  }

  private find(key: TKey): TKey | typeof HashTable.MISSING {
    const comparer = this.comparer;
    if (Object.isUndefined(comparer))
      return this.entries.has(key) ? key : HashTable.MISSING;

    const bucket = this.buckets.get(comparer.hash(key));
    if (!Object.isUndefined(bucket))
      for (const candidate of bucket)
        if (comparer.equals(candidate, key))
          return candidate;

    return HashTable.MISSING;
  }

  private insert(key: TKey, value: TValue): void {
    this.entries.set(key, value);

    const comparer = this.comparer;
    if (Object.isUndefined(comparer))
      return;

    const hash = comparer.hash(key);
    const bucket = this.buckets.get(hash);
    if (Object.isUndefined(bucket))
      this.buckets.set(hash, [key]);
    else
      bucket.push(key);
  }
}
