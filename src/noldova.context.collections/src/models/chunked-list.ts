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
import { ListChunk } from "./list-chunk.js";
import { ReadOnlyList } from "./read-only-list.js";

export class ChunkedList<T extends {} | null> extends Enumerable<T> implements IReadOnlyList<T> {
  private readonly changes: ChangeCounter = new ChangeCounter();
  private readonly chunkSize: number;
  private readonly fill: T;
  private readonly weigh: (item: T) => number;
  private chunks: ListChunk<T>[] = [];
  private starts: number[] = [];
  private length: number = 0;
  private total: number = 0;

  public constructor(chunkSize: number, fill: T, length: number = 0, weigh: (item: T) => number = ChunkedList.weighNothing) {
    super();

    ArgumentOutOfRangeException.throwIfNotPositiveInteger(chunkSize, Resources.chunkSizeParameterName);
    ArgumentOutOfRangeException.throwIfNotInteger(length, Resources.lengthParameterName);
    ArgumentOutOfRangeException.throwIfNegative(length, Resources.lengthParameterName);

    this.chunkSize = chunkSize;
    this.fill = fill;
    this.weigh = weigh;
    for (let start = 0; start < length; start += chunkSize)
      this.chunks.push(ListChunk.ofFill(fill, Math.min(chunkSize, length - start), weigh));
    this.reindex();
  }

  public get totalWeight(): number {
    return this.total;
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
    return Object.isUndefined(predicate) ? this.length : super.count(predicate);
  }

  public get(index: number): T {
    const item = this.tryGet(index);
    if (Object.isUndefined(item))
      throw new ArgumentOutOfRangeException(Resources.indexParameterName, index);

    return item;
  }

  public tryGet(index: number): T | undefined {
    const chunk = this.chunkAt(index);

    return chunk?.get(index - chunk.start);
  }

  public set(index: number, item: T): void {
    const chunk = this.chunkAt(index);
    if (Object.isUndefined(chunk))
      throw new ArgumentOutOfRangeException(Resources.indexParameterName, index);

    this.total += chunk.set(index - chunk.start, item, this.weigh);
    this.changes.increment();
  }

  public add(item: T): void {
    this.replace(this.length, 0, [item]);
  }

  public addRange(items: Iterable<T>): void {
    this.replace(this.length, 0, Array.from(items));
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
    if (index + count > this.length)
      throw new ArgumentOutOfRangeException(Resources.countParameterName, count);

    this.replace(index, count, []);
  }

  public removeAll(predicate: (item: T) => boolean): number {
    const kept = this.toArray().filter((item: T): boolean => !predicate(item));
    const removed = this.length - kept.length;
    this.replace(0, this.length, kept);

    return removed;
  }

  public clear(): void {
    this.chunks = [];
    this.reindex();
    this.changes.increment();
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
    this.replace(0, this.length, this.toArray().sort(comparison));
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

    for (const chunk of this.chunks.values().drop(Math.max(this.chunkIndexOf(index), 0))) {
      const local = chunk.sum === 0 ? -1 : chunk.nextWeightedIndex(index - chunk.start, this.weigh);
      if (local >= 0)
        return chunk.start + local;
    }

    return -1;
  }

  public previousWeightedIndex(index: number): number {
    this.throwIfNotPosition(index);

    for (const chunk of this.chunks.slice(0, this.chunkIndexOf(index - 1) + 1).reverse()) {
      const local = chunk.sum === 0 ? -1 : chunk.previousWeightedIndex(index - chunk.start, this.weigh);
      if (local >= 0)
        return chunk.start + local;
    }

    return -1;
  }

  private static weighNothing(): number {
    return 0;
  }

  private chunkIndexOf(index: number): number {
    return BinarySearchService.floorIndex(this.starts, index);
  }

  private chunkAt(index: number): ListChunk<T> | undefined {
    const chunk = this.chunks[this.chunkIndexOf(index)];
    if (!Number.isInteger(index) || index >= this.length || Object.isUndefined(chunk))
      return undefined;

    return chunk;
  }

  private replace(index: number, removed: number, items: readonly T[]): void {
    const first = Math.max(this.chunkIndexOf(index), 0);
    const last = Math.max(this.chunkIndexOf(index + removed - 1), first);
    const touched = this.chunks.slice(first, last + 1);
    const local = index - (touched[0]?.start ?? 0);
    const kept = touched.flatMap(t => Array.from(t));
    const values = [...kept.slice(0, local), ...items, ...kept.slice(local + removed)];
    const replacing: ListChunk<T>[] = [];
    for (let start = 0; start < values.length; start += this.chunkSize)
      replacing.push(ListChunk.of(this.fill, values.slice(start, start + this.chunkSize), this.weigh));

    this.chunks = [...this.chunks.slice(0, first), ...replacing, ...this.chunks.slice(last + 1)];
    this.reindex();
    this.changes.increment();
  }

  private reindex(): void {
    const starts: number[] = [];
    let length = 0;
    let total = 0;
    for (const chunk of this.chunks) {
      chunk.start = length;
      starts.push(length);
      length += chunk.length;
      total += chunk.sum;
    }

    this.starts = starts;
    this.length = length;
    this.total = total;
  }

  private throwIfNotPosition(index: number): void {
    ArgumentOutOfRangeException.throwIfNotInteger(index, Resources.indexParameterName);
    ArgumentOutOfRangeException.throwIfNegative(index, Resources.indexParameterName);
    if (index > this.length)
      throw new ArgumentOutOfRangeException(Resources.indexParameterName, index);
  }
}
