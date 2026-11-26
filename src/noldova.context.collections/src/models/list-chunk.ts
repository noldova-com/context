/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { EqualityComparers } from "../services/equality-comparers.js";

export class ListChunk<T extends {} | null> {
  private readonly fill: T;
  private items: T[] | null;
  public readonly length: number;
  public start: number = 0;
  public sum: number;

  private constructor(fill: T, items: T[] | null, length: number, sum: number) {
    this.fill = fill;
    this.items = items;
    this.length = length;
    this.sum = sum;
  }

  public static ofFill<T extends {} | null>(fill: T, length: number, weigh: (item: T) => number): ListChunk<T> {
    return new ListChunk(fill, null, length, length * weigh(fill));
  }

  public static of<T extends {} | null>(fill: T, items: T[], weigh: (item: T) => number): ListChunk<T> {
    return new ListChunk(fill, items, items.length, ListChunk.weighAll(items, weigh));
  }

  public *[Symbol.iterator](): Generator<T> {
    if (Object.isNull(this.items)) {
      for (let local = 0; local < this.length; local++)
        yield this.fill;
    }
    else
      yield* this.items;
  }

  public get(local: number): T | undefined {
    return Object.isNull(this.items) ? this.fill : this.items[local];
  }

  public set(local: number, item: T, weigh: (item: T) => number): number {
    this.items ??= new Array<T>(this.length).fill(this.fill);
    const change = weigh(item) - ListChunk.weighAll(this.items.splice(local, 1, item), weigh);
    this.sum += change;

    return change;
  }

  public indexOf(item: T): number {
    let local = 0;
    for (const candidate of this) {
      if (EqualityComparers.default.equals(candidate, item))
        return local;
      local++;
    }

    return -1;
  }

  public weightBefore(local: number, weigh: (item: T) => number): number {
    return Object.isNull(this.items) ? local * weigh(this.fill) : ListChunk.weighAll(this.items.slice(0, local), weigh);
  }

  public nextWeightedIndex(from: number, weigh: (item: T) => number): number {
    let local = 0;
    for (const item of this) {
      if (local >= from && weigh(item) > 0)
        return local;
      local++;
    }

    return -1;
  }

  public previousWeightedIndex(before: number, weigh: (item: T) => number): number {
    let found = -1;
    let local = 0;
    for (const item of this) {
      if (local < before && weigh(item) > 0)
        found = local;
      local++;
    }

    return found;
  }

  private static weighAll<T>(items: readonly T[], weigh: (item: T) => number): number {
    let sum = 0;
    for (const item of items)
      sum += weigh(item);

    return sum;
  }
}
