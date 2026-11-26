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
import { ListChunks } from "./list-chunks.js";
import { ReadOnlyList } from "./read-only-list.js";

export class ChunkedList<T extends {} | null> extends Enumerable<T> implements IReadOnlyList<T> {
  private readonly changes: ChangeCounter = new ChangeCounter();
  private readonly chunks: ListChunks<T>;
  private readonly weigh: (item: T) => number;

  public constructor(chunkSize: number, fill: T, length: number = 0, weigh: (item: T) => number = ChunkedList.weighNothing) {
    super();

    ArgumentOutOfRangeException.throwIfNotPositiveInteger(chunkSize, Resources.chunkSizeParameterName);
    ArgumentOutOfRangeException.throwIfNotInteger(length, Resources.lengthParameterName);
    ArgumentOutOfRangeException.throwIfNegative(length, Resources.lengthParameterName);

    this.chunks = new ListChunks(chunkSize, fill, length, weigh);
    this.weigh = weigh;
  }

  public get totalWeight(): number {
    return this.chunks.totalWeight;
  }

  public override *[Symbol.iterator](): Generator<T> {
    const version = this.changes.value;
    for (const chunk of this.chunks)
      for (const item of chunk) {
        yield item;
        this.changes.throwIfChangedSince(version);
      }
  }

  public override count(predicate?: (item: T) => boolean): number {
    return Object.isUndefined(predicate) ? this.chunks.length : super.count(predicate);
  }

  public override last(predicate?: (item: T) => boolean): T {
    const count = this.count();

    return Object.isUndefined(predicate) && count > 0 ? this.get(count - 1) : super.last(predicate);
  }

  public override lastOrDefault(predicate?: (item: T) => boolean): T | undefined {
    return Object.isUndefined(predicate) ? this.tryGet(this.count() - 1) : super.lastOrDefault(predicate);
  }

  public override elementAt(index: number): T {
    return Number.isInteger(index) && index >= 0 ? this.get(index) : super.elementAt(index);
  }

  public override elementAtOrDefault(index: number): T | undefined {
    return this.tryGet(index);
  }

  public get(index: number): T {
    const item = this.tryGet(index);
    if (Object.isUndefined(item))
      throw new ArgumentOutOfRangeException(Resources.indexParameterName, index);

    return item;
  }

  public tryGet(index: number): T | undefined {
    const chunk = this.chunks.at(index);

    return chunk?.get(index - chunk.start);
  }

  public set(index: number, item: T): void {
    const chunk = this.chunks.at(index);
    if (Object.isUndefined(chunk))
      throw new ArgumentOutOfRangeException(Resources.indexParameterName, index);

    this.chunks.set(chunk, index, item);
    this.changes.increment();
  }

  public add(item: T): void {
    this.replace(this.chunks.length, 0, [item]);
  }

  public addRange(items: Iterable<T>): void {
    this.replace(this.chunks.length, 0, Array.from(items));
  }

  public insert(index: number, item: T): void {
    this.insertRange(index, [item]);
  }

  public insertRange(index: number, items: Iterable<T>): void {
    this.throwIfNotPosition(index);

    this.replace(index, 0, Array.from(items));
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
    this.replace(index, 1, []);
  }

  public removeRange(index: number, count: number): void {
    this.throwIfNotPosition(index);
    ArgumentOutOfRangeException.throwIfNotInteger(count, Resources.countParameterName);
    ArgumentOutOfRangeException.throwIfNegative(count, Resources.countParameterName);
    if (index + count > this.chunks.length)
      throw new ArgumentOutOfRangeException(Resources.countParameterName, count);

    this.replace(index, count, []);
  }

  public removeAll(predicate: (item: T) => boolean): number {
    const kept = this.toArray().filter((item: T): boolean => !predicate(item));
    const removed = this.chunks.length - kept.length;
    this.replace(0, this.chunks.length, kept);

    return removed;
  }

  public clear(): void {
    this.replace(0, this.chunks.length, []);
  }

  public indexOf(item: T): number {
    for (const chunk of this.chunks) {
      const local = chunk.indexOf(item);
      if (local >= 0)
        return chunk.start + local;
    }

    return -1;
  }

  public lastIndexOf(item: T): number {
    return this.toArray().findLastIndex((candidate: T): boolean => EqualityComparers.default.equals(candidate, item));
  }

  public sort(comparison: Comparison<T> = Comparer.compare): void {
    this.replace(0, this.chunks.length, this.toArray().sort(comparison));
  }

  public binarySearch(item: T, comparison: Comparison<T> = Comparer.compare): number {
    return BinarySearchService.search(this, item, comparison);
  }

  public asReadOnly(): ReadOnlyList<T> {
    return new ReadOnlyList<T>(this);
  }

  public weightBefore(index: number): number {
    this.throwIfNotPosition(index);

    let weight = 0;
    for (const chunk of this.chunks) {
      if (chunk.start + chunk.length > index)
        return weight + chunk.weightBefore(index - chunk.start, this.weigh);
      weight += chunk.sum;
    }

    return weight;
  }

  public nextWeightedIndex(index: number): number {
    this.throwIfNotPosition(index);

    for (const chunk of this.chunks.from(index)) {
      const local = chunk.sum === 0 ? -1 : chunk.nextWeightedIndex(index - chunk.start, this.weigh);
      if (local >= 0)
        return chunk.start + local;
    }

    return -1;
  }

  public previousWeightedIndex(index: number): number {
    this.throwIfNotPosition(index);

    for (const chunk of this.chunks.backFrom(index - 1)) {
      const local = chunk.sum === 0 ? -1 : chunk.previousWeightedIndex(index - chunk.start, this.weigh);
      if (local >= 0)
        return chunk.start + local;
    }

    return -1;
  }

  private static weighNothing(): number {
    return 0;
  }

  private replace(index: number, removed: number, items: readonly T[]): void {
    this.chunks.replace(index, removed, items);
    this.changes.increment();
  }

  private throwIfNotPosition(index: number): void {
    ArgumentOutOfRangeException.throwIfNotInteger(index, Resources.indexParameterName);
    ArgumentOutOfRangeException.throwIfNegative(index, Resources.indexParameterName);
    if (index > this.chunks.length)
      throw new ArgumentOutOfRangeException(Resources.indexParameterName, index);
  }
}
