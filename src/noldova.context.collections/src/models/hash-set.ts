/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { IEqualityComparer } from "../interfaces/i-equality-comparer.js";
import type { IReadOnlySet } from "../interfaces/i-read-only-set.js";
import { Enumerable } from "./enumerable.js";
import { HashTable } from "./hash-table.js";
import { ReadOnlySet } from "./read-only-set.js";

export class HashSet<T> extends Enumerable<T> implements IReadOnlySet<T> {
  private readonly comparer: IEqualityComparer<T> | undefined;
  private readonly table: HashTable<T, true>;

  public constructor(items: Iterable<T> = [], comparer?: IEqualityComparer<T>) {
    super();

    this.comparer = comparer;
    this.table = new HashTable<T, true>(comparer);
    for (const item of items)
      this.table.tryAdd(item, true);
  }

  public override *[Symbol.iterator](): Generator<T> {
    const version = this.table.changes.value;
    for (const item of this.table.keys()) {
      yield item;
      this.table.changes.throwIfChangedSince(version);
    }
  }

  public override count(predicate?: (item: T) => boolean): number {
    return Object.isUndefined(predicate) ? this.table.size : super.count(predicate);
  }

  public override contains(item: T, comparer?: IEqualityComparer<T>): boolean {
    return Object.isUndefined(comparer) ? this.table.has(item) : super.contains(item, comparer);
  }

  public add(item: T): boolean {
    return this.table.tryAdd(item, true);
  }

  public remove(item: T): boolean {
    return this.table.delete(item);
  }

  public clear(): void {
    this.table.clear();
  }

  public unionWith(other: Iterable<T>): void {
    for (const item of Array.from(other))
      this.table.tryAdd(item, true);
  }

  public intersectWith(other: Iterable<T>): void {
    const kept = this.tableOf(other);
    for (const item of Array.from(this.table.keys()))
      if (!kept.has(item))
        this.table.delete(item);
  }

  public exceptWith(other: Iterable<T>): void {
    for (const item of Array.from(other))
      this.table.delete(item);
  }

  public symmetricExceptWith(other: Iterable<T>): void {
    for (const item of Array.from(this.tableOf(other).keys()))
      if (!this.table.delete(item))
        this.table.tryAdd(item, true);
  }

  public isSubsetOf(other: Iterable<T>): boolean {
    const others = this.tableOf(other);

    return this.all((item: T): boolean => others.has(item));
  }

  public isSupersetOf(other: Iterable<T>): boolean {
    return Iterator.from(other).every((item: T): boolean => this.table.has(item));
  }

  public overlaps(other: Iterable<T>): boolean {
    return Iterator.from(other).some((item: T): boolean => this.table.has(item));
  }

  public setEquals(other: Iterable<T>): boolean {
    const others = this.tableOf(other);

    return others.size === this.table.size && this.all((item: T): boolean => others.has(item));
  }

  public asReadOnly(): ReadOnlySet<T> {
    return new ReadOnlySet<T>(this);
  }

  private tableOf(items: Iterable<T>): HashTable<T, true> {
    const table = new HashTable<T, true>(this.comparer);
    for (const item of items)
      table.tryAdd(item, true);

    return table;
  }
}
