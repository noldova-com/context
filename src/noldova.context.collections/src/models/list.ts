/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";

import type { IReadOnlyList } from "../interfaces/i-read-only-list.js";
import { Resources } from "../resources.js";
import { BinarySearchService } from "../services/binary-search.service.js";
import { Comparer } from "../services/comparer.js";
import { EqualityComparers } from "../services/equality-comparers.js";
import type { Comparison } from "../types/comparison.js";
import { ChangeCounter } from "./change-counter.js";
import { Enumerable } from "./enumerable.js";
import { ReadOnlyList } from "./read-only-list.js";

export class List<T extends {} | null> extends Enumerable<T> implements IReadOnlyList<T> {
  private readonly changes: ChangeCounter = new ChangeCounter();
  private items: T[];

  public constructor(items: Iterable<T> = []) {
    super();

    this.items = Array.from(items);
  }

  public override *[Symbol.iterator](): Generator<T> {
    const version = this.changes.value;
    for (const item of this.items) {
      yield item;
      this.changes.throwIfChangedSince(version);
    }
  }

  public override count(predicate?: (item: T) => boolean): number {
    return Object.isUndefined(predicate) ? this.items.length : super.count(predicate);
  }

  public get(index: number): T {
    const item = this.items[index];
    if (Object.isUndefined(item))
      throw new ArgumentOutOfRangeException(Resources.indexParameterName, index);

    return item;
  }

  public tryGet(index: number): T | undefined {
    return this.items[index];
  }

  public forEach(action: (item: T) => void): void {
    for (const item of this)
      action(item);
  }

  public set(index: number, item: T): void {
    this.get(index);
    this.items[index] = item;
    this.changes.increment();
  }

  public add(item: T): void {
    this.items.push(item);
    this.changes.increment();
  }

  public addRange(items: Iterable<T>): void {
    for (const item of Array.from(items))
      this.items.push(item);
    this.changes.increment();
  }

  public insert(index: number, item: T): void {
    this.insertRange(index, [item]);
  }

  public insertRange(index: number, items: Iterable<T>): void {
    this.throwIfNotPosition(index);

    const inserted = Array.from(items);
    const tail = this.items.splice(index);
    for (const item of inserted)
      this.items.push(item);
    for (const item of tail)
      this.items.push(item);
    this.changes.increment();
  }

  public remove(item: T): boolean {
    const index = this.indexOf(item);
    if (index < 0)
      return false;

    this.removeAt(index);

    return true;
  }

  public removeAt(index: number): void {
    this.get(index);
    this.items.splice(index, 1);
    this.changes.increment();
  }

  public removeRange(index: number, count: number): void {
    this.throwIfNotPosition(index);
    ArgumentOutOfRangeException.throwIfNotInteger(count, Resources.countParameterName);
    ArgumentOutOfRangeException.throwIfNegative(count, Resources.countParameterName);
    if (index + count > this.items.length)
      throw new ArgumentOutOfRangeException(Resources.countParameterName, count);

    this.items.splice(index, count);
    this.changes.increment();
  }

  public removeAll(predicate: (item: T) => boolean): number {
    const kept = this.items.filter((item: T): boolean => !predicate(item));
    const removed = this.items.length - kept.length;
    this.items = kept;
    this.changes.increment();

    return removed;
  }

  public clear(): void {
    this.items = [];
    this.changes.increment();
  }

  public indexOf(item: T): number {
    return this.items.findIndex((candidate: T): boolean => EqualityComparers.default.equals(candidate, item));
  }

  public lastIndexOf(item: T): number {
    return this.items.findLastIndex((candidate: T): boolean => EqualityComparers.default.equals(candidate, item));
  }

  public sort(comparison: Comparison<T> = Comparer.compare): void {
    this.items.sort(comparison);
    this.changes.increment();
  }

  public binarySearch(item: T, comparison: Comparison<T> = Comparer.compare): number {
    return BinarySearchService.search(this.items, item, comparison);
  }

  public asReadOnly(): ReadOnlyList<T> {
    return new ReadOnlyList<T>(this);
  }

  private throwIfNotPosition(index: number): void {
    ArgumentOutOfRangeException.throwIfNotInteger(index, Resources.indexParameterName);
    ArgumentOutOfRangeException.throwIfNegative(index, Resources.indexParameterName);
    if (index > this.items.length)
      throw new ArgumentOutOfRangeException(Resources.indexParameterName, index);
  }
}
