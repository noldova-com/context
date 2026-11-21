/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { ArgumentOutOfRangeException, InvalidOperationException } from "@noldova/context.exceptions";

import type { IEqualityComparer } from "../interfaces/i-equality-comparer.js";
import { Resources } from "../resources.js";
import { Comparer } from "../services/comparer.js";
import { EqualityComparers } from "../services/equality-comparers.js";
import type { Comparison } from "../types/comparison.js";
import { HashTable } from "./hash-table.js";

export abstract class Enumerable<T> implements Iterable<T> {
  private static readonly MISSING: unique symbol = Symbol("missing");

  public static from<T>(source: Iterable<T>): Enumerable<T> {
    return new QueryEnumerable<T>(() => source[Symbol.iterator]());
  }

  public static empty<T>(): Enumerable<T> {
    return Enumerable.from<T>([]);
  }

  public static range(start: number, count: number): Enumerable<number> {
    ArgumentOutOfRangeException.throwIfNotInteger(start, Resources.startParameterName);
    Enumerable.throwIfNotCount(count);
    if (!Number.isSafeInteger(start))
      throw new ArgumentOutOfRangeException(Resources.startParameterName, start, Resources.rangeNotSafe);
    if (count > 0 && start > Number.MAX_SAFE_INTEGER - (count - 1))
      throw new ArgumentOutOfRangeException(Resources.countParameterName, count, Resources.rangeNotSafe);

    return new QueryEnumerable<number>(() => Enumerable.rangeItems(start, count));
  }

  public static repeat<T>(value: T, count: number): Enumerable<T> {
    Enumerable.throwIfNotCount(count);

    return new QueryEnumerable<T>(() => Enumerable.repeatItems(value, count));
  }

  public abstract [Symbol.iterator](): Iterator<T>;

  public where<TResult extends T>(predicate: (item: T, index: number) => item is TResult): Enumerable<TResult>;
  public where(predicate: (item: T, index: number) => boolean): Enumerable<T>;
  public where(predicate: (item: T, index: number) => boolean): Enumerable<T> {
    return new QueryEnumerable<T>(() => Iterator.from(this).filter(predicate));
  }

  public select<TResult>(selector: (item: T, index: number) => TResult): Enumerable<TResult> {
    return new QueryEnumerable<TResult>(() => Iterator.from(this).map(selector));
  }

  public selectMany<TResult>(selector: (item: T, index: number) => Iterable<TResult>): Enumerable<TResult> {
    return new QueryEnumerable<TResult>(() => Enumerable.selectManyItems(this, selector));
  }

  public join<TInner, TKey, TResult>(
    inner: Iterable<TInner>,
    outerKey: (item: T) => TKey,
    innerKey: (item: TInner) => TKey,
    result: (outer: T, inner: TInner) => TResult,
    comparer?: IEqualityComparer<TKey>): Enumerable<TResult> {
    return new QueryEnumerable<TResult>(() => Enumerable.joinItems(this, inner, outerKey, innerKey, result, comparer));
  }

  public groupJoin<TInner, TKey, TResult>(
    inner: Iterable<TInner>,
    outerKey: (item: T) => TKey,
    innerKey: (item: TInner) => TKey,
    result: (outer: T, inner: Enumerable<TInner>) => TResult,
    comparer?: IEqualityComparer<TKey>): Enumerable<TResult> {
    return new QueryEnumerable<TResult>(() => Enumerable.groupJoinItems(this, inner, outerKey, innerKey, result, comparer));
  }

  public distinct(comparer?: IEqualityComparer<T>): Enumerable<T> {
    return this.distinctBy((item: T): T => item, comparer);
  }

  public distinctBy<TKey>(key: (item: T) => TKey, comparer?: IEqualityComparer<TKey>): Enumerable<T> {
    return new QueryEnumerable<T>(() => Enumerable.distinctItems([this], key, comparer));
  }

  public union(other: Iterable<T>, comparer?: IEqualityComparer<T>): Enumerable<T> {
    return new QueryEnumerable<T>(() => Enumerable.distinctItems([this, other], (item: T): T => item, comparer));
  }

  public intersect(other: Iterable<T>, comparer?: IEqualityComparer<T>): Enumerable<T> {
    return new QueryEnumerable<T>(() => Enumerable.intersectItems(this, other, comparer));
  }

  public except(other: Iterable<T>, comparer?: IEqualityComparer<T>): Enumerable<T> {
    return new QueryEnumerable<T>(() => Enumerable.exceptItems(this, other, comparer));
  }

  public concat(other: Iterable<T>): Enumerable<T> {
    return new QueryEnumerable<T>(() => Enumerable.concatItems(this, other));
  }

  public append(item: T): Enumerable<T> {
    return this.concat([item]);
  }

  public prepend(item: T): Enumerable<T> {
    return new QueryEnumerable<T>(() => Enumerable.concatItems([item], this));
  }

  public skip(count: number): Enumerable<T> {
    ArgumentOutOfRangeException.throwIfNotInteger(count, Resources.countParameterName);

    return new QueryEnumerable<T>(() => Iterator.from(this).drop(Math.max(count, 0)));
  }

  public take(count: number): Enumerable<T> {
    ArgumentOutOfRangeException.throwIfNotInteger(count, Resources.countParameterName);

    return new QueryEnumerable<T>(() => Iterator.from(this).take(Math.max(count, 0)));
  }

  public skipWhile(predicate: (item: T, index: number) => boolean): Enumerable<T> {
    return new QueryEnumerable<T>(() => Enumerable.skipWhileItems(this, predicate));
  }

  public takeWhile(predicate: (item: T, index: number) => boolean): Enumerable<T> {
    return new QueryEnumerable<T>(() => Enumerable.takeWhileItems(this, predicate));
  }

  public skipLast(count: number): Enumerable<T> {
    ArgumentOutOfRangeException.throwIfNotInteger(count, Resources.countParameterName);

    return new QueryEnumerable<T>(() => Enumerable.skipLastItems(this, Math.max(count, 0)));
  }

  public takeLast(count: number): Enumerable<T> {
    ArgumentOutOfRangeException.throwIfNotInteger(count, Resources.countParameterName);

    return new QueryEnumerable<T>(() => Enumerable.takeLastItems(this, Math.max(count, 0)));
  }

  public reverse(): Enumerable<T> {
    return new QueryEnumerable<T>(() => Iterator.from(Array.from(this).reverse()));
  }

  public chunk(size: number): Enumerable<readonly T[]> {
    ArgumentOutOfRangeException.throwIfNotPositiveInteger(size, Resources.sizeParameterName);

    return new QueryEnumerable<readonly T[]>(() => Enumerable.chunkItems(this, size));
  }

  public zip<TOther, TResult>(other: Iterable<TOther>, result: (first: T, second: TOther) => TResult): Enumerable<TResult> {
    return new QueryEnumerable<TResult>(() => Enumerable.zipItems(this, other, result));
  }

  public first(predicate?: (item: T) => boolean): T {
    const match = Enumerable.firstMatch(this, predicate);
    if (match === Enumerable.MISSING)
      throw new InvalidOperationException(Enumerable.missingMessage(predicate));

    return match;
  }

  public firstOrDefault(predicate?: (item: T) => boolean): T | undefined {
    const match = Enumerable.firstMatch(this, predicate);

    return match === Enumerable.MISSING ? undefined : match;
  }

  public last(predicate?: (item: T) => boolean): T {
    const match = Enumerable.lastMatch(this, predicate);
    if (match === Enumerable.MISSING)
      throw new InvalidOperationException(Enumerable.missingMessage(predicate));

    return match;
  }

  public lastOrDefault(predicate?: (item: T) => boolean): T | undefined {
    const match = Enumerable.lastMatch(this, predicate);

    return match === Enumerable.MISSING ? undefined : match;
  }

  public single(predicate?: (item: T) => boolean): T {
    const match = Enumerable.singleMatch(this, predicate);
    if (match === Enumerable.MISSING)
      throw new InvalidOperationException(Enumerable.missingMessage(predicate));

    return match;
  }

  public singleOrDefault(predicate?: (item: T) => boolean): T | undefined {
    const match = Enumerable.singleMatch(this, predicate);

    return match === Enumerable.MISSING ? undefined : match;
  }

  public elementAt(index: number): T {
    ArgumentOutOfRangeException.throwIfNotInteger(index, Resources.indexParameterName);
    ArgumentOutOfRangeException.throwIfNegative(index, Resources.indexParameterName);
    const match = Enumerable.elementMatch(this, index);
    if (match === Enumerable.MISSING)
      throw new ArgumentOutOfRangeException(Resources.indexParameterName, index);

    return match;
  }

  public elementAtOrDefault(index: number): T | undefined {
    if (!Number.isInteger(index) || index < 0)
      return undefined;

    const match = Enumerable.elementMatch(this, index);

    return match === Enumerable.MISSING ? undefined : match;
  }

  public any(predicate?: (item: T) => boolean): boolean {
    return Enumerable.firstMatch(this, predicate) !== Enumerable.MISSING;
  }

  public all(predicate: (item: T) => boolean): boolean {
    return Iterator.from(this).every((item: T): boolean => predicate(item));
  }

  public contains(item: T, comparer: IEqualityComparer<T> = EqualityComparers.default): boolean {
    return Iterator.from(this).some((candidate: T): boolean => comparer.equals(candidate, item));
  }

  public count(predicate?: (item: T) => boolean): number {
    let count = 0;
    for (const item of this)
      if (Object.isUndefined(predicate) || predicate(item))
        count++;

    return count;
  }

  public sum(this: Enumerable<number>): number;
  public sum(selector: (item: T) => number): number;
  public sum(selector?: (item: T) => number): number {
    let total = 0;
    for (const item of this)
      total += Enumerable.numberOf(item, selector);

    return total;
  }

  public average(this: Enumerable<number>): number;
  public average(selector: (item: T) => number): number;
  public average(selector?: (item: T) => number): number {
    let total = 0;
    let count = 0;
    for (const item of this) {
      total += Enumerable.numberOf(item, selector);
      count++;
    }
    if (count === 0)
      throw new InvalidOperationException(Resources.sequenceEmpty);

    return total / count;
  }

  public min(comparison: Comparison<T> = Comparer.compare): T {
    return Enumerable.extreme(this, (item: T): T => item, comparison, -1);
  }

  public max(comparison: Comparison<T> = Comparer.compare): T {
    return Enumerable.extreme(this, (item: T): T => item, comparison, 1);
  }

  public minBy<TKey>(key: (item: T) => TKey, comparison: Comparison<TKey> = Comparer.compare): T {
    return Enumerable.extreme(this, key, comparison, -1);
  }

  public maxBy<TKey>(key: (item: T) => TKey, comparison: Comparison<TKey> = Comparer.compare): T {
    return Enumerable.extreme(this, key, comparison, 1);
  }

  public aggregate<TAccumulate>(seed: TAccumulate, accumulator: (total: TAccumulate, item: T) => TAccumulate): TAccumulate {
    let total = seed;
    for (const item of this)
      total = accumulator(total, item);

    return total;
  }

  public sequenceEqual(other: Iterable<T>, comparer: IEqualityComparer<T> = EqualityComparers.default): boolean {
    const right = other[Symbol.iterator]();
    try {
      for (const item of this) {
        const next = right.next();
        if (next.done === true || !comparer.equals(item, next.value))
          return false;
      }

      return right.next().done === true;
    }
    finally {
      Enumerable.close(right);
    }
  }

  public toArray(): T[] {
    return Array.from(this);
  }

  private static throwIfNotCount(count: number): void {
    ArgumentOutOfRangeException.throwIfNotInteger(count, Resources.countParameterName);
    ArgumentOutOfRangeException.throwIfNegative(count, Resources.countParameterName);
  }

  private static missingMessage<T>(predicate: ((item: T) => boolean) | undefined): string {
    return Object.isUndefined(predicate) ? Resources.sequenceEmpty : Resources.noMatch;
  }

  private static firstMatch<T>(source: Iterable<T>, predicate: ((item: T) => boolean) | undefined): T | typeof Enumerable.MISSING {
    for (const item of source)
      if (Object.isUndefined(predicate) || predicate(item))
        return item;

    return Enumerable.MISSING;
  }

  private static lastMatch<T>(source: Iterable<T>, predicate: ((item: T) => boolean) | undefined): T | typeof Enumerable.MISSING {
    let match: T | typeof Enumerable.MISSING = Enumerable.MISSING;
    for (const item of source)
      if (Object.isUndefined(predicate) || predicate(item))
        match = item;

    return match;
  }

  private static singleMatch<T>(source: Iterable<T>, predicate: ((item: T) => boolean) | undefined): T | typeof Enumerable.MISSING {
    let match: T | typeof Enumerable.MISSING = Enumerable.MISSING;
    for (const item of source)
      if (Object.isUndefined(predicate) || predicate(item)) {
        if (match !== Enumerable.MISSING)
          throw new InvalidOperationException(Object.isUndefined(predicate) ? Resources.moreThanOneElement : Resources.moreThanOneMatch);
        match = item;
      }

    return match;
  }

  private static elementMatch<T>(source: Iterable<T>, index: number): T | typeof Enumerable.MISSING {
    let position = 0;
    for (const item of source)
      if (position++ === index)
        return item;

    return Enumerable.MISSING;
  }

  private static numberOf<T>(item: T, selector: ((item: T) => number) | undefined): number {
    const value: unknown = Object.isUndefined(selector) ? item : selector(item);
    if (!Object.isNumber(value))
      throw new InvalidOperationException(Resources.notANumber);

    return value;
  }

  private static extreme<T, TKey>(source: Iterable<T>, key: (item: T) => TKey, comparison: Comparison<TKey>, sign: number): T {
    const items = source[Symbol.iterator]();
    try {
      const first = items.next();
      if (first.done === true)
        throw new InvalidOperationException(Resources.sequenceEmpty);

      let best = first.value;
      let bestKey = key(best);
      for (let next = items.next(); next.done !== true; next = items.next()) {
        const itemKey = key(next.value);
        if (Math.sign(comparison(itemKey, bestKey)) === sign) {
          best = next.value;
          bestKey = itemKey;
        }
      }

      return best;
    }
    finally {
      Enumerable.close(items);
    }
  }

  private static close(iterator: Iterator<unknown>): void {
    if (!Object.isUndefined(iterator.return))
      iterator.return();
  }

  private static *rangeItems(start: number, count: number): Generator<number> {
    for (let offset = 0; offset < count; offset++)
      yield start + offset;
  }

  private static *repeatItems<T>(value: T, count: number): Generator<T> {
    for (let index = 0; index < count; index++)
      yield value;
  }

  private static *selectManyItems<T, TResult>(source: Iterable<T>, selector: (item: T, index: number) => Iterable<TResult>): Generator<TResult> {
    let index = 0;
    for (const item of source)
      yield* selector(item, index++);
  }

  private static *joinItems<T, TInner, TKey, TResult>(
    outer: Iterable<T>,
    inner: Iterable<TInner>,
    outerKey: (item: T) => TKey,
    innerKey: (item: TInner) => TKey,
    result: (outer: T, inner: TInner) => TResult,
    comparer: IEqualityComparer<TKey> | undefined): Generator<TResult> {
    const groups = HashTable.groupOf(inner, innerKey, comparer);
    for (const item of outer)
      for (const match of groups.get(outerKey(item)) ?? [])
        yield result(item, match);
  }

  private static *groupJoinItems<T, TInner, TKey, TResult>(
    outer: Iterable<T>,
    inner: Iterable<TInner>,
    outerKey: (item: T) => TKey,
    innerKey: (item: TInner) => TKey,
    result: (outer: T, inner: Enumerable<TInner>) => TResult,
    comparer: IEqualityComparer<TKey> | undefined): Generator<TResult> {
    const groups = HashTable.groupOf(inner, innerKey, comparer);
    for (const item of outer)
      yield result(item, Enumerable.from(groups.get(outerKey(item)) ?? []));
  }

  private static *distinctItems<T, TKey>(sources: readonly Iterable<T>[], key: (item: T) => TKey, comparer: IEqualityComparer<TKey> | undefined): Generator<T> {
    const seen = new HashTable<TKey, true>(comparer);
    for (const source of sources)
      for (const item of source)
        if (seen.tryAdd(key(item), true))
          yield item;
  }

  private static *intersectItems<T>(source: Iterable<T>, other: Iterable<T>, comparer: IEqualityComparer<T> | undefined): Generator<T> {
    const kept = new HashTable<T, true>(comparer);
    for (const item of other)
      kept.tryAdd(item, true);
    for (const item of source)
      if (kept.delete(item))
        yield item;
  }

  private static *exceptItems<T>(source: Iterable<T>, other: Iterable<T>, comparer: IEqualityComparer<T> | undefined): Generator<T> {
    const seen = new HashTable<T, true>(comparer);
    for (const item of other)
      seen.tryAdd(item, true);
    for (const item of source)
      if (seen.tryAdd(item, true))
        yield item;
  }

  private static *concatItems<T>(first: Iterable<T>, second: Iterable<T>): Generator<T> {
    yield* first;
    yield* second;
  }

  private static *skipWhileItems<T>(source: Iterable<T>, predicate: (item: T, index: number) => boolean): Generator<T> {
    let index = 0;
    let skipping = true;
    for (const item of source) {
      skipping &&= predicate(item, index++);
      if (!skipping)
        yield item;
    }
  }

  private static *takeWhileItems<T>(source: Iterable<T>, predicate: (item: T, index: number) => boolean): Generator<T> {
    let index = 0;
    for (const item of source) {
      if (!predicate(item, index++))
        return;
      yield item;
    }
  }

  private static *skipLastItems<T>(source: Iterable<T>, count: number): Generator<T> {
    const items = Array.from(source);

    yield* items.slice(0, Math.max(items.length - count, 0));
  }

  private static *takeLastItems<T>(source: Iterable<T>, count: number): Generator<T> {
    const items = Array.from(source);

    yield* items.slice(Math.max(items.length - count, 0));
  }

  private static *chunkItems<T>(source: Iterable<T>, size: number): Generator<readonly T[]> {
    let chunk: T[] = [];
    for (const item of source) {
      chunk.push(item);
      if (chunk.length === size) {
        yield chunk;
        chunk = [];
      }
    }
    if (chunk.length > 0)
      yield chunk;
  }

  private static *zipItems<T, TOther, TResult>(source: Iterable<T>, other: Iterable<TOther>, result: (first: T, second: TOther) => TResult): Generator<TResult> {
    const right = other[Symbol.iterator]();
    try {
      for (const item of source) {
        const next = right.next();
        if (next.done === true)
          return;
        yield result(item, next.value);
      }
    }
    finally {
      Enumerable.close(right);
    }
  }
}

export class QueryEnumerable<T> extends Enumerable<T> {
  private readonly factory: () => Iterator<T>;

  public constructor(factory: () => Iterator<T>) {
    super();

    this.factory = factory;
  }

  public override [Symbol.iterator](): Iterator<T> {
    return this.factory();
  }
}
