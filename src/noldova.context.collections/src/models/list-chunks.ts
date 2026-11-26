/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { BinarySearchService } from "../services/binary-search.service.js";
import { ListChunk } from "./list-chunk.js";

export class ListChunks<T extends {} | null> implements Iterable<ListChunk<T>> {
  private readonly chunkSize: number;
  private readonly fill: T;
  private readonly weigh: (item: T) => number;
  private chunks: ListChunk<T>[] = [];
  private starts: number[] = [];
  private count: number = 0;
  private total: number = 0;

  public constructor(chunkSize: number, fill: T, length: number, weigh: (item: T) => number) {
    this.chunkSize = chunkSize;
    this.fill = fill;
    this.weigh = weigh;
    for (let start = 0; start < length; start += chunkSize)
      this.chunks.push(ListChunk.ofFill(fill, Math.min(chunkSize, length - start), weigh));
    this.reindex();
  }

  public get length(): number {
    return this.count;
  }

  public get totalWeight(): number {
    return this.total;
  }

  public [Symbol.iterator](): Iterator<ListChunk<T>> {
    return this.chunks[Symbol.iterator]();
  }

  public at(index: number): ListChunk<T> | undefined {
    const chunk = this.chunks[this.indexOf(index)];
    if (!Number.isInteger(index) || index >= this.count || Object.isUndefined(chunk))
      return undefined;

    return chunk;
  }

  public from(index: number): Iterable<ListChunk<T>> {
    return this.chunks.values().drop(Math.max(this.indexOf(index), 0));
  }

  public backFrom(index: number): Iterable<ListChunk<T>> {
    return this.chunks.slice(0, this.indexOf(index) + 1).reverse();
  }

  public set(chunk: ListChunk<T>, index: number, item: T): void {
    this.total += chunk.set(index - chunk.start, item, this.weigh);
  }

  public replace(index: number, removed: number, items: readonly T[]): void {
    let first = Math.max(this.indexOf(index), 0);
    let last = Math.max(this.indexOf(index + removed - 1), first);
    const head = this.chunks[first];
    const tail = this.chunks[last];
    let values = [
      ...head?.slice(0, index - head.start) ?? [],
      ...items,
      ...tail?.slice(index + removed - tail.start) ?? []];

    const previous = this.chunks[first - 1];
    const next = this.chunks[last + 1];
    if (values.length > 0 && values.length < this.chunkSize / 2) {
      if (!Object.isUndefined(previous)) {
        values = [...previous.slice(0), ...values];
        first--;
      }
      else if (!Object.isUndefined(next)) {
        values = [...values, ...next.slice(0)];
        last++;
      }
    }

    const pieces = Math.ceil(values.length / this.chunkSize);
    const replacing: ListChunk<T>[] = [];
    for (let piece = 0; piece < pieces; piece++)
      replacing.push(ListChunk.of(this.fill, values.slice(Math.floor(piece * values.length / pieces), Math.floor((piece + 1) * values.length / pieces)), this.weigh));

    this.chunks = [...this.chunks.slice(0, first), ...replacing, ...this.chunks.slice(last + 1)];
    this.reindex();
  }

  private indexOf(index: number): number {
    return BinarySearchService.floorIndex(this.starts, index);
  }

  private reindex(): void {
    const starts: number[] = [];
    let count = 0;
    let total = 0;
    for (const chunk of this.chunks) {
      chunk.start = count;
      starts.push(count);
      count += chunk.length;
      total += chunk.sum;
    }

    this.starts = starts;
    this.count = count;
    this.total = total;
  }
}
