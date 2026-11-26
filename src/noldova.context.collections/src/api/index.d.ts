/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Binary searches over sorted items: arrays or read-only lists.
 *
 * @remarks
 * The items must be sorted by the comparison the search uses; the order isn't checked. Each
 * search reads O(log n) items, where n is the number of items searched, and doesn't copy or keep
 * them. `index` and `count` search part of the items; omitted, the search covers them all.
 */
export declare class BinarySearchService {
  /**
   * Finds the last array position whose value is less than or equal to the target.
   *
   * @param values The numbers to search, sorted from smallest to greatest.
   * Equal consecutive values are allowed.
   * @param target The inclusive comparison limit. An exact match is not required;
   * when none exists, the search finds the nearest lower value.
   * @returns The zero-based index of the last qualifying value. If that value
   * occurs more than once, returns its last index. Returns `-1` when no value
   * qualifies, including an empty array or a target below the first value.
   *
   * @remarks
   * Ordering is a caller precondition and is not checked. The method does not sort,
   * modify, copy, or retain the array. It performs O(log n) comparisons and uses
   * O(1) additional storage, where n is the number of values.
   *
   * @example
   * ```ts
   * import { BinarySearchService } from "@noldova/context.collections";
   *
   * BinarySearchService.floorIndex([1, 3, 5, 7], 5); // 2: exact match.
   * BinarySearchService.floorIndex([1, 3, 5, 7], 4); // 1: the nearest lower value is 3.
   * BinarySearchService.floorIndex([1, 3, 3, 5], 3); // 2: the last duplicate.
   * BinarySearchService.floorIndex([1, 3, 5], 9); // 2: the last value is below the target.
   * BinarySearchService.floorIndex([1, 3, 5], 0); // -1: all values exceed the target.
   * BinarySearchService.floorIndex([], 5); // -1: the array is empty.
   * ```
   */
  public static floorIndex(values: readonly number[], target: number): number;

  /**
   * Finds an item's position in sorted items.
   *
   * @param items The items, sorted by `comparison`.
   * @param item The item to find.
   * @param comparison The order. Omitted, it is {@link Comparer.compare}.
   * @param index The first position searched; 0 when omitted.
   * @param count How many items are searched; the rest from `index` when omitted.
   * @returns The position of an item the comparison finds equal, any one of them when there are
   * several, or the bitwise complement (`~`) of the position where the item would be inserted to
   * keep the order, which is negative.
   * @throws ArgumentOutOfRangeException When `index` or `count` isn't an integer from 0, or they
   * reach past the items.
   * @throws ArgumentException When an array has a hole at a position the search reads.
   * @example
   * ```ts
   * import { BinarySearchService } from "@noldova/context.collections";
   *
   * BinarySearchService.search([1, 3, 5], 3); // 1
   * ~BinarySearchService.search([1, 3, 5], 4); // 2: insert 4 at position 2.
   * ```
   */
  public static search<T extends {} | null>(items: readonly T[] | IReadOnlyList<T>, item: T, comparison?: Comparison<T>, index?: number, count?: number): number;

  /**
   * Finds the first position whose item isn't before the key.
   *
   * @param items The items, sorted by `comparison`.
   * @param key The key, compared with each item.
   * @param comparison The order. Omitted, it is {@link Comparer.compare}.
   * @param index The first position searched; 0 when omitted.
   * @param count How many items are searched; the rest from `index` when omitted.
   * @returns The position, from `index` to `index + count`; `index + count` when every item is
   * before the key.
   * @throws ArgumentOutOfRangeException When `index` or `count` isn't an integer from 0, or they
   * reach past the items.
   * @throws ArgumentException When an array has a hole at a position the search reads.
   * @example
   * ```ts
   * import { BinarySearchService } from "@noldova/context.collections";
   *
   * BinarySearchService.lowerBound([1, 3, 3, 5], 3); // 1
   * BinarySearchService.lowerBound([1, 3, 3, 5], 4); // 3
   * ```
   */
  public static lowerBound<T extends {} | null>(items: readonly T[] | IReadOnlyList<T>, key: T, comparison?: Comparison<T>, index?: number, count?: number): number;

  /**
   * Finds the first position whose item is after the key.
   *
   * @param items The items, sorted by `comparison`.
   * @param key The key, compared with each item.
   * @param comparison The order. Omitted, it is {@link Comparer.compare}.
   * @param index The first position searched; 0 when omitted.
   * @param count How many items are searched; the rest from `index` when omitted.
   * @returns The position, from `index` to `index + count`; `index + count` when no item is
   * after the key.
   * @throws ArgumentOutOfRangeException When `index` or `count` isn't an integer from 0, or they
   * reach past the items.
   * @throws ArgumentException When an array has a hole at a position the search reads.
   * @example
   * ```ts
   * import { BinarySearchService } from "@noldova/context.collections";
   *
   * BinarySearchService.upperBound([1, 3, 3, 5], 3); // 3
   * BinarySearchService.upperBound([1, 3, 3, 5], 0); // 0
   * ```
   */
  public static upperBound<T extends {} | null>(items: readonly T[] | IReadOnlyList<T>, key: T, comparison?: Comparison<T>, index?: number, count?: number): number;

  /**
   * Finds the first position whose item's key isn't before the key.
   *
   * @param items The items, sorted by `select`'s key and `comparison`.
   * @param key The key, compared with each item's.
   * @param select Gives an item's key.
   * @param comparison The order of keys. Omitted, it is {@link Comparer.compare}.
   * @param index The first position searched; 0 when omitted.
   * @param count How many items are searched; the rest from `index` when omitted.
   * @returns The position, from `index` to `index + count`; `index + count` when every item's
   * key is before the key.
   * @throws ArgumentOutOfRangeException When `index` or `count` isn't an integer from 0, or they
   * reach past the items.
   * @throws ArgumentException When an array has a hole at a position the search reads.
   * @example
   * ```ts
   * import { BinarySearchService } from "@noldova/context.collections";
   *
   * const words = ["a", "bb", "ccc", "dddd"];
   * BinarySearchService.lowerBoundBy(words, 3, t => t.length); // 2: the first word of 3 letters or more.
   * ```
   */
  public static lowerBoundBy<T extends {} | null, TKey>(items: readonly T[] | IReadOnlyList<T>, key: TKey, select: (item: T) => TKey, comparison?: Comparison<TKey>,
    index?: number, count?: number): number;

  /**
   * Finds the first position whose item's key is after the key.
   *
   * @param items The items, sorted by `select`'s key and `comparison`.
   * @param key The key, compared with each item's.
   * @param select Gives an item's key.
   * @param comparison The order of keys. Omitted, it is {@link Comparer.compare}.
   * @param index The first position searched; 0 when omitted.
   * @param count How many items are searched; the rest from `index` when omitted.
   * @returns The position, from `index` to `index + count`; `index + count` when no item's key
   * is after the key.
   * @throws ArgumentOutOfRangeException When `index` or `count` isn't an integer from 0, or they
   * reach past the items.
   * @throws ArgumentException When an array has a hole at a position the search reads.
   * @example
   * ```ts
   * import { BinarySearchService } from "@noldova/context.collections";
   *
   * const words = ["a", "bb", "ccc", "dddd"];
   * BinarySearchService.upperBoundBy(words, 2, t => t.length); // 2: the first word longer than 2 letters.
   * ```
   */
  public static upperBoundBy<T extends {} | null, TKey>(items: readonly T[] | IReadOnlyList<T>, key: TKey, select: (item: T) => TKey, comparison?: Comparison<TKey>,
    index?: number, count?: number): number;
}

/**
 * Orders two values: a negative number when `left` comes first, zero when they
 * are equal in this order, a positive number when `right` comes first. Any
 * function of this shape also serves `Array.prototype.sort`.
 *
 * @template T The type of the values ordered.
 */
export declare type Comparison<T> = (left: T, right: T) => number;

/**
 * Decides which keys are the same for a {@link Dictionary}, a {@link HashSet}
 * and the query operators that match keys, such as `distinct`, `groupBy`,
 * `join` and `union`.
 *
 * @template T The type of the values compared.
 *
 * @remarks
 * `equals` must be reflexive, symmetric and transitive, and values it calls
 * equal must return the same `hash`. Unequal values may share a hash; fewer
 * shared hashes make lookups faster. Neither method may change while the value
 * is a key in a collection.
 *
 * @example
 * ```ts
 * import { Dictionary, type IEqualityComparer } from "@noldova/context.collections";
 *
 * class IgnoringCase implements IEqualityComparer<string> {
 *   public equals(left: string, right: string): boolean {
 *     return left.toLowerCase() === right.toLowerCase();
 *   }
 *
 *   public hash(value: string): number {
 *     return value.toLowerCase().length;
 *   }
 * }
 *
 * const users = new Dictionary<string, number>([], new IgnoringCase());
 * users.set("Leo", 1);
 * users.get("LEO"); // 1
 * ```
 */
export declare interface IEqualityComparer<T> {
  /**
   * Tells whether two values are the same key.
   */
  equals(left: T, right: T): boolean;

  /**
   * Returns a number that is the same for every pair of values `equals` calls equal.
   */
  hash(value: T): number;
}

/**
 * SameValueZero, the equality `Map` and `Set` use, with a hash for any
 * value; {@link EqualityComparers.default} is one.
 *
 * @remarks
 * Primitives are equal by value, with `NaN` equal to `NaN` and `-0` equal to
 * `0`, and objects and functions by reference. The hash reads a primitive's
 * text and numbers each object the first time this comparer hashes it, holding
 * no reference that keeps the object alive; another comparer numbers objects
 * on its own.
 */
export declare class DefaultEqualityComparer implements IEqualityComparer<unknown> {
  /**
   * Creates a comparer with its own numbering of objects.
   */
  public constructor();

  /**
   * Tells whether two values are the same by SameValueZero.
   */
  public equals(left: unknown, right: unknown): boolean;

  /**
   * Returns the FNV-1a hash of a primitive's text, or this comparer's number
   * for an object or a function.
   */
  public hash(value: unknown): number;
}

/**
 * An equality that compares a key of each value; {@link EqualityComparers.by}
 * builds one.
 *
 * @template T The type of the values compared.
 * @template TKey The type of the keys compared.
 */
export declare class KeyEqualityComparer<T, TKey> implements IEqualityComparer<T> {
  /**
   * Creates an equality that compares the keys of values.
   *
   * @param key Selects the key compared. It is called on each value compared and hashed.
   * @param comparer The equality of the keys.
   */
  public constructor(key: (item: T) => TKey, comparer: IEqualityComparer<TKey>);

  /**
   * Tells whether the keys of two values are equal.
   */
  public equals(left: T, right: T): boolean;

  /**
   * Returns the hash of the value's key.
   */
  public hash(value: T): number;
}

/**
 * One entry of a {@link Dictionary}: a key and its value.
 *
 * @template TKey The type of the key.
 * @template TValue The type of the value.
 */
export declare class KeyValuePair<TKey, TValue> {
  /**
   * Pairs a key with its value.
   *
   * @param key The entry's key.
   * @param value The value stored under the key.
   * @example
   * ```ts
   * import { Dictionary, KeyValuePair } from "@noldova/context.collections";
   *
   * const ages = new Dictionary([new KeyValuePair("Leo", 7)]);
   * ```
   */
  public constructor(key: TKey, value: TValue);

  /**
   * The entry's key.
   */
  public readonly key: TKey;

  /**
   * The value stored under the key.
   */
  public readonly value: TValue;
}

/**
 * The default ordering of values, and ways to build orderings from it.
 */
export declare class Comparer {
  /**
   * Orders two values of the same kind: numbers and bigints by value, strings by
   * UTF-16 code unit as `<` does, `false` before `true`, and Dates by time.
   * `undefined` comes before `null`, and both come before every other value.
   * `NaN` comes before every number and equals `NaN`; `-0` equals `0`.
   *
   * @param left The first value.
   * @param right The second value.
   * @returns `-1`, `0` or `1`.
   * @throws {ArgumentException} When the values are of kinds this order doesn't
   * cover, such as two objects or a number and a string.
   *
   * @remarks
   * The string order is the same on every locale and host. For the order of
   * Unicode code points, which differs past U+FFFF, pass
   * `CodePointComparer.compare` from `@noldova/context.text`.
   *
   * @example
   * ```ts
   * import { Comparer } from "@noldova/context.collections";
   *
   * Comparer.compare(1, 2); // -1
   * Comparer.compare("b", "a"); // 1
   * Comparer.compare(null, 0); // -1
   * ```
   */
  public static compare<T>(left: T, right: T): number;

  /**
   * Reverses an ordering.
   *
   * @param comparison The ordering to reverse.
   * @returns An ordering that puts `right` first wherever `comparison` puts `left` first.
   * @example
   * ```ts
   * import { Comparer } from "@noldova/context.collections";
   *
   * [1, 3, 2].sort(Comparer.descending(Comparer.compare)); // [3, 2, 1]
   * ```
   */
  public static descending<T>(comparison: Comparison<T>): Comparison<T>;
}

/**
 * The default key equality, and ways to build equalities from it.
 */
export declare class EqualityComparers {
  /**
   * SameValueZero, the equality `Map` and `Set` use: primitives by value, with
   * `NaN` equal to `NaN` and `-0` equal to `0`, and objects and functions by
   * reference. Its hash reads a primitive's text and numbers each object the
   * first time it hashes it, holding no reference that keeps the object alive.
   *
   * @example
   * ```ts
   * import { EqualityComparers } from "@noldova/context.collections";
   *
   * EqualityComparers.default.equals(Number.NaN, Number.NaN); // true
   * EqualityComparers.default.equals(new Date(0), new Date(0)); // false: two objects.
   * ```
   */
  public static readonly default: DefaultEqualityComparer;

  /**
   * Builds an equality that compares a key of each value.
   *
   * @param key Selects the key compared. It is called on each value compared and hashed.
   * @param comparer The equality of the keys. Omitted, it is {@link EqualityComparers.default}.
   * @returns An equality that calls two values equal when their keys are.
   * @example
   * ```ts
   * import { EqualityComparers, HashSet } from "@noldova/context.collections";
   *
   * const names = new HashSet(["Ana", "ana", "Leo"], EqualityComparers.by((t: string) => t.toLowerCase()));
   * names.count(); // 2
   * ```
   */
  public static by<T, TKey>(key: (item: T) => TKey, comparer?: IEqualityComparer<TKey>): KeyEqualityComparer<T, TKey>;
}

/**
 * The base of every collection and query: a sequence that can be enumerated
 * any number of times, with the query operators.
 *
 * @template T The type of the elements.
 *
 * @remarks
 * Operators that return an {@link Enumerable} are deferred: they run nothing
 * until the result is enumerated, and they run again on each enumeration, so
 * they see the source as it is then. The other operators run at once.
 * `toArray`, `toList`, `toHashSet` and `toDictionary` copy the elements into a
 * new collection that doesn't follow later changes to the source.
 *
 * Methods that require an element throw when there is none: the `…OrDefault`
 * form returns `undefined` instead, since `undefined` means that there is no value
 * and `null` is a value someone set. An element that is `undefined` can't be
 * told from no element there.
 *
 * @example
 * ```ts
 * import { Enumerable, List } from "@noldova/context.collections";
 *
 * const ages = new List([31, 42, 27]);
 * ages.where(t => t < 40).orderBy(t => t).select(t => `${t} years`).toArray(); // ["27 years", "31 years"]
 * Enumerable.from([1, 2, 3]).sum(); // 6
 * ages.firstOrDefault(t => t > 50); // undefined
 * ```
 */
export declare class Enumerable<T> implements Iterable<T> {
  /**
   * Makes a sequence for a subclass. A subclass either passes the factory or
   * overrides `[Symbol.iterator]`; outside a subclass, `Enumerable.from` makes one.
   *
   * @param factory Starts each enumeration of the elements. Without it, the
   * sequence has no elements.
   * @example
   * ```ts
   * import { Enumerable } from "@noldova/context.collections";
   *
   * class Countdown extends Enumerable<number> {
   *   public constructor(start: number) {
   *     super(() => Iterator.from([start, start - 1, start - 2]));
   *   }
   * }
   *
   * new Countdown(3).toArray(); // [3, 2, 1]
   * ```
   */
  protected constructor(factory?: () => Iterator<T>);

  /**
   * Wraps any iterable, such as an array, a `Map` or a generator, in the query operators.
   *
   * @param source The elements. Each enumeration of the result enumerates the
   * source again, so a one-time iterable, such as a generator object, yields its
   * elements once.
   * @returns A deferred sequence of the source's elements.
   * @example
   * ```ts
   * import { Enumerable } from "@noldova/context.collections";
   *
   * Enumerable.from(new Set([1, 2])).select(t => t * 10).toArray(); // [10, 20]
   * ```
   */
  public static from<T>(source: Iterable<T>): Enumerable<T>;

  /**
   * Returns a sequence with no elements.
   */
  public static empty<T>(): Enumerable<T>;

  /**
   * Returns `count` consecutive integers from `start`.
   *
   * @param start The first integer.
   * @param count How many integers.
   * @throws {ArgumentOutOfRangeException} When `start` isn't an integer, `count`
   * isn't a non-negative integer, or an integer of the range isn't a safe integer.
   * @example
   * ```ts
   * import { Enumerable } from "@noldova/context.collections";
   *
   * Enumerable.range(5, 3).toArray(); // [5, 6, 7]
   * ```
   */
  public static range(start: number, count: number): Enumerable<number>;

  /**
   * Returns one value `count` times.
   *
   * @throws {ArgumentOutOfRangeException} When `count` isn't a non-negative integer.
   */
  public static repeat<T>(value: T, count: number): Enumerable<T>;

  /**
   * Starts an enumeration of the elements.
   */
  public [Symbol.iterator](): Iterator<T>;

  /**
   * Keeps the elements that match. A type guard narrows the result's element type.
   *
   * @param predicate Called with each element and its zero-based position in this sequence.
   * @example
   * ```ts
   * import "@noldova/context.core";
   * import { Enumerable } from "@noldova/context.collections";
   *
   * Enumerable.from([1, null, 2]).where(t => !Object.isNull(t)).toArray(); // [1, 2], typed number[].
   * ```
   */
  public where<TResult extends T>(predicate: (item: T, index: number) => item is TResult): Enumerable<TResult>;
  public where(predicate: (item: T, index: number) => boolean): Enumerable<T>;

  /**
   * Maps each element.
   *
   * @param selector Called with each element and its zero-based position.
   */
  public select<TResult>(selector: (item: T, index: number) => TResult): Enumerable<TResult>;

  /**
   * Maps each element to a sequence and joins those sequences into one.
   *
   * @param selector Called with each element and its zero-based position.
   * @example
   * ```ts
   * import { Enumerable } from "@noldova/context.collections";
   *
   * Enumerable.from(["ab", "c"]).selectMany(t => t).toArray(); // ["a", "b", "c"]
   * ```
   */
  public selectMany<TResult>(selector: (item: T, index: number) => Iterable<TResult>): Enumerable<TResult>;

  /**
   * Pairs each element with each element of `inner` that has an equal key, in
   * this sequence's order and then `inner`'s. An element with no match is left out.
   *
   * @param inner The elements to match. It is read once, on each enumeration.
   * @param outerKey Selects the key of this sequence's elements.
   * @param innerKey Selects the key of `inner`'s elements.
   * @param result Builds a result from a matched pair.
   * @param comparer The key equality. Omitted, it is SameValueZero.
   * @example
   * ```ts
   * import { Enumerable, KeyValuePair } from "@noldova/context.collections";
   *
   * const users = [new KeyValuePair(1, "Ana")];
   * const devices = [new KeyValuePair(1, "phone"), new KeyValuePair(1, "laptop")];
   * Enumerable.from(users).join(devices, t => t.key, t => t.key, (user, device) => `${user.value} ${device.value}`).toArray();
   * // ["Ana phone", "Ana laptop"]
   * ```
   */
  public join<TInner, TKey, TResult>(
    inner: Iterable<TInner>,
    outerKey: (item: T) => TKey,
    innerKey: (item: TInner) => TKey,
    result: (outer: T, inner: TInner) => TResult,
    comparer?: IEqualityComparer<TKey>): Enumerable<TResult>;

  /**
   * Pairs each element with all elements of `inner` that have an equal key, an
   * empty sequence when none do.
   *
   * @param inner The elements to match. It is read once, on each enumeration.
   * @param outerKey Selects the key of this sequence's elements.
   * @param innerKey Selects the key of `inner`'s elements.
   * @param result Builds a result from an element and its matches, in `inner`'s order.
   * @param comparer The key equality. Omitted, it is SameValueZero.
   */
  public groupJoin<TInner, TKey, TResult>(
    inner: Iterable<TInner>,
    outerKey: (item: T) => TKey,
    innerKey: (item: TInner) => TKey,
    result: (outer: T, inner: Enumerable<TInner>) => TResult,
    comparer?: IEqualityComparer<TKey>): Enumerable<TResult>;

  /**
   * Keeps the first of each set of equal elements.
   *
   * @param comparer The equality. Omitted, it is SameValueZero.
   */
  public distinct(comparer?: IEqualityComparer<T>): Enumerable<T>;

  /**
   * Keeps the first element of each key.
   *
   * @param key Selects the key compared.
   * @param comparer The key equality. Omitted, it is SameValueZero.
   */
  public distinctBy<TKey>(key: (item: T) => TKey, comparer?: IEqualityComparer<TKey>): Enumerable<T>;

  /**
   * The distinct elements of this sequence and then of `other`.
   *
   * @param comparer The equality. Omitted, it is SameValueZero.
   */
  public union(other: Iterable<T>, comparer?: IEqualityComparer<T>): Enumerable<T>;

  /**
   * The distinct elements of this sequence that `other` also holds, in this sequence's order.
   *
   * @param comparer The equality. Omitted, it is SameValueZero.
   */
  public intersect(other: Iterable<T>, comparer?: IEqualityComparer<T>): Enumerable<T>;

  /**
   * The distinct elements of this sequence that `other` doesn't hold.
   *
   * @param comparer The equality. Omitted, it is SameValueZero.
   */
  public except(other: Iterable<T>, comparer?: IEqualityComparer<T>): Enumerable<T>;

  /**
   * The elements of this sequence and then of `other`.
   */
  public concat(other: Iterable<T>): Enumerable<T>;

  /**
   * The elements of this sequence and then `item`.
   */
  public append(item: T): Enumerable<T>;

  /**
   * `item` and then the elements of this sequence.
   */
  public prepend(item: T): Enumerable<T>;

  /**
   * Leaves out the first `count` elements; a count of zero or less leaves out none.
   *
   * @throws {ArgumentOutOfRangeException} When `count` isn't an integer.
   */
  public skip(count: number): Enumerable<T>;

  /**
   * Keeps the first `count` elements; a count of zero or less keeps none.
   *
   * @throws {ArgumentOutOfRangeException} When `count` isn't an integer.
   * @example
   * ```ts
   * import { Enumerable } from "@noldova/context.collections";
   *
   * Enumerable.range(1, 100).skip(20).take(10).toArray(); // [21, …, 30]
   * ```
   */
  public take(count: number): Enumerable<T>;

  /**
   * Leaves out elements while they match, and keeps the rest from the first that doesn't.
   *
   * @param predicate Called with each element and its zero-based position until it returns false.
   */
  public skipWhile(predicate: (item: T, index: number) => boolean): Enumerable<T>;

  /**
   * Keeps elements while they match, and stops at the first that doesn't.
   *
   * @param predicate Called with each element and its zero-based position until it returns false.
   */
  public takeWhile(predicate: (item: T, index: number) => boolean): Enumerable<T>;

  /**
   * Leaves out the last `count` elements. It reads the whole sequence before
   * it yields the first element.
   *
   * @throws {ArgumentOutOfRangeException} When `count` isn't an integer.
   */
  public skipLast(count: number): Enumerable<T>;

  /**
   * Keeps the last `count` elements. It reads the whole sequence first.
   *
   * @throws {ArgumentOutOfRangeException} When `count` isn't an integer.
   */
  public takeLast(count: number): Enumerable<T>;

  /**
   * The elements in the opposite order. It reads the whole sequence first.
   */
  public reverse(): Enumerable<T>;

  /**
   * Splits the elements into arrays of `size`; the last may be shorter.
   *
   * @throws {ArgumentOutOfRangeException} When `size` isn't a positive integer.
   * @example
   * ```ts
   * import { Enumerable } from "@noldova/context.collections";
   *
   * Enumerable.range(1, 5).chunk(2).toArray(); // [[1, 2], [3, 4], [5]]
   * ```
   */
  public chunk(size: number): Enumerable<readonly T[]>;

  /**
   * Combines the elements at the same position in this sequence and `other`,
   * and stops at the end of the shorter sequence.
   *
   * @param other The sequence to read alongside this one.
   * @param result Builds one result from the two elements at a position.
   * @example
   * ```ts
   * import { Enumerable } from "@noldova/context.collections";
   *
   * Enumerable.from(["a", "b", "c"]).zip([1, 2], (letter, count) => letter.repeat(count)).toArray(); // ["a", "bb"]
   * ```
   */
  public zip<TOther, TResult>(other: Iterable<TOther>, result: (first: T, second: TOther) => TResult): Enumerable<TResult>;

  /**
   * The first element, or the first that matches.
   *
   * @throws {InvalidOperationException} When there is none.
   */
  public first(predicate?: (item: T) => boolean): T;

  /**
   * The first element, or the first that matches; `undefined` when there is none.
   */
  public firstOrDefault(predicate?: (item: T) => boolean): T | undefined;

  /**
   * The last element, or the last that matches.
   *
   * @throws {InvalidOperationException} When there is none.
   */
  public last(predicate?: (item: T) => boolean): T;

  /**
   * The last element, or the last that matches; `undefined` when there is none.
   */
  public lastOrDefault(predicate?: (item: T) => boolean): T | undefined;

  /**
   * The only element, or the only one that matches.
   *
   * @throws {InvalidOperationException} When there is none, or more than one.
   */
  public single(predicate?: (item: T) => boolean): T;

  /**
   * The only element, or the only one that matches; `undefined` when there is none.
   *
   * @throws {InvalidOperationException} When there is more than one.
   */
  public singleOrDefault(predicate?: (item: T) => boolean): T | undefined;

  /**
   * The element at a zero-based position.
   *
   * @throws {ArgumentOutOfRangeException} When there is no element there; a
   * negative or fractional position throws before the sequence is read.
   */
  public elementAt(index: number): T;

  /**
   * The element at a zero-based position; `undefined` when there is none, and at
   * once, without reading the sequence, for a negative or fractional position.
   */
  public elementAtOrDefault(index: number): T | undefined;

  /**
   * Tells whether there is an element, or one that matches.
   */
  public any(predicate?: (item: T) => boolean): boolean;

  /**
   * Tells whether every element matches; true for an empty sequence.
   */
  public all(predicate: (item: T) => boolean): boolean;

  /**
   * Tells whether an element equals `item`.
   *
   * @param comparer The equality. Omitted, it is SameValueZero; a {@link HashSet}
   * then uses its own equality.
   */
  public contains(item: T, comparer?: IEqualityComparer<T>): boolean;

  /**
   * Counts the elements, or those that match. A collection counts its own
   * elements at once; other sequences enumerate.
   */
  public count(predicate?: (item: T) => boolean): number;

  /**
   * Adds the numbers, or the numbers `selector` returns; zero for an empty sequence.
   *
   * @throws {InvalidOperationException} When a value isn't a number, as only an
   * untyped caller can pass.
   */
  public sum(this: Enumerable<number>): number;
  public sum(selector: (item: T) => number): number;

  /**
   * The mean of the numbers, or of the numbers `selector` returns.
   *
   * @throws {InvalidOperationException} When the sequence is empty, or a value isn't a number.
   */
  public average(this: Enumerable<number>): number;
  public average(selector: (item: T) => number): number;

  /**
   * The smallest element, the first of equal ones.
   *
   * @param comparison The order. Omitted, it is {@link Comparer.compare}.
   * @throws {InvalidOperationException} When the sequence is empty.
   */
  public min(comparison?: Comparison<T>): T;

  /**
   * The largest element, the first of equal ones.
   *
   * @param comparison The order. Omitted, it is {@link Comparer.compare}.
   * @throws {InvalidOperationException} When the sequence is empty.
   */
  public max(comparison?: Comparison<T>): T;

  /**
   * The element with the smallest key, the first of equal ones.
   *
   * @param comparison The order of the keys. Omitted, it is {@link Comparer.compare}.
   * @throws {InvalidOperationException} When the sequence is empty.
   */
  public minBy<TKey>(key: (item: T) => TKey, comparison?: Comparison<TKey>): T;

  /**
   * The element with the largest key, the first of equal ones.
   *
   * @param comparison The order of the keys. Omitted, it is {@link Comparer.compare}.
   * @throws {InvalidOperationException} When the sequence is empty.
   */
  public maxBy<TKey>(key: (item: T) => TKey, comparison?: Comparison<TKey>): T;

  /**
   * Folds the elements into one value, starting from `seed`.
   */
  public aggregate<TAccumulate>(seed: TAccumulate, accumulator: (total: TAccumulate, item: T) => TAccumulate): TAccumulate;

  /**
   * Tells whether both sequences have equal elements in the same order.
   *
   * @param comparer The equality. Omitted, it is SameValueZero.
   */
  public sequenceEqual(other: Iterable<T>, comparer?: IEqualityComparer<T>): boolean;

  /**
   * Orders the elements by a key, keeping the order of elements with equal keys.
   * It reads the whole sequence first, on each enumeration, and calls `key` once
   * for each element.
   *
   * @param comparison The order of the keys. Omitted, it is {@link Comparer.compare}.
   * @example
   * ```ts
   * import { Enumerable } from "@noldova/context.collections";
   *
   * Enumerable.from(["bb", "b", "ab", "a"]).orderBy(t => t.length).thenBy(t => t).toArray(); // ["a", "b", "ab", "bb"]
   * ```
   */
  public orderBy<TKey>(key: (item: T) => TKey, comparison?: Comparison<TKey>): OrderedEnumerable<T>;

  /**
   * Orders the elements by a key, largest first, keeping the order of elements with equal keys.
   *
   * @param comparison The order of the keys. Omitted, it is {@link Comparer.compare}.
   */
  public orderByDescending<TKey>(key: (item: T) => TKey, comparison?: Comparison<TKey>): OrderedEnumerable<T>;

  /**
   * Groups the elements by key, in the order each key first appears. It reads
   * the whole sequence first, on each enumeration.
   *
   * @param comparer The key equality. Omitted, it is SameValueZero.
   * @example
   * ```ts
   * import { Enumerable } from "@noldova/context.collections";
   *
   * Enumerable.from(["apple", "avocado", "banana"]).groupBy(t => t[0])
   *   .select(t => `${t.key}: ${t.count()}`).toArray(); // ["a: 2", "b: 1"]
   * ```
   */
  public groupBy<TKey>(key: (item: T) => TKey, comparer?: IEqualityComparer<TKey>): Enumerable<Grouping<TKey, T>>;

  /**
   * Copies the elements into a new array.
   */
  public toArray(): T[];

  /**
   * Copies the elements into a new {@link List}. The elements can't be
   * `undefined`, which a list uses to mean no element.
   */
  public toList<TItem extends {} | null>(this: Enumerable<TItem>): List<TItem>;

  /**
   * Copies the distinct elements into a new {@link HashSet}.
   *
   * @param comparer The set's equality. Omitted, it is SameValueZero.
   */
  public toHashSet(comparer?: IEqualityComparer<T>): HashSet<T>;

  /**
   * Copies the elements into a new {@link Dictionary}.
   *
   * @param key Selects each entry's key.
   * @param value Selects each entry's value; it can't return `undefined`.
   * @param comparer The dictionary's key equality. Omitted, it is SameValueZero.
   * @throws {ArgumentException} When two elements have equal keys.
   * @example
   * ```ts
   * import { Enumerable } from "@noldova/context.collections";
   *
   * const lengths = Enumerable.from(["Ana", "Mia"]).toDictionary(t => t, t => t.length);
   * lengths.get("Mia"); // 3
   * ```
   */
  public toDictionary<TKey, TValue extends {} | null>(key: (item: T) => TKey, value: (item: T) => TValue, comparer?: IEqualityComparer<TKey>): Dictionary<TKey, TValue>;
}

/**
 * A sequence ordered by `orderBy` or `orderByDescending`, which further keys can refine.
 *
 * @template T The type of the elements.
 */
export declare class OrderedEnumerable<T> extends Enumerable<T> {
  private constructor();

  /**
   * Starts an enumeration of the ordered elements.
   */
  public [Symbol.iterator](): Iterator<T>;

  /**
   * Orders elements that the earlier keys leave equal by another key.
   *
   * @param comparison The order of the keys. Omitted, it is {@link Comparer.compare}.
   */
  public thenBy<TKey>(key: (item: T) => TKey, comparison?: Comparison<TKey>): OrderedEnumerable<T>;

  /**
   * Orders elements that the earlier keys leave equal by another key, largest first.
   *
   * @param comparison The order of the keys. Omitted, it is {@link Comparer.compare}.
   */
  public thenByDescending<TKey>(key: (item: T) => TKey, comparison?: Comparison<TKey>): OrderedEnumerable<T>;
}

/**
 * The elements of one key, from `groupBy`, in their sequence's order.
 *
 * @template TKey The type of the key.
 * @template T The type of the elements.
 */
export declare class Grouping<TKey, T> extends Enumerable<T> {
  private constructor();

  /**
   * The key the elements share.
   */
  public readonly key: TKey;

  /**
   * Starts an enumeration of the group's elements.
   */
  public [Symbol.iterator](): Iterator<T>;
}

/**
 * What can be read from a list: the contract {@link List} and
 * {@link ReadOnlyList} implement, for a parameter that only reads a list.
 *
 * @template T The type of the elements; not `undefined`, which means no element.
 */
export declare interface IReadOnlyList<T extends {} | null> extends Enumerable<T> {
  /**
   * The element at a zero-based position.
   *
   * @throws {ArgumentOutOfRangeException} When there is no element there.
   */
  get(index: number): T;

  /**
   * The element at a zero-based position; `undefined` when there is none.
   */
  tryGet(index: number): T | undefined;

  /**
   * The position of the first element equal to `item` by SameValueZero, or `-1`.
   */
  indexOf(item: T): number;
}

/**
 * What can be read from a dictionary: the contract {@link Dictionary} and
 * {@link ReadOnlyDictionary} implement, for a parameter that only reads a
 * dictionary.
 *
 * @template TKey The type of the keys.
 * @template TValue The type of the values; not `undefined`, which means no value.
 */
export declare interface IReadOnlyDictionary<TKey, TValue extends {} | null> extends Enumerable<KeyValuePair<TKey, TValue>> {
  /**
   * The value of a key.
   *
   * @throws {KeyNotFoundException} When the dictionary has no such key.
   */
  get(key: TKey): TValue;

  /**
   * The value of a key; `undefined` when the dictionary has no such key.
   */
  tryGet(key: TKey): TValue | undefined;

  /**
   * Tells whether the dictionary has a key.
   */
  containsKey(key: TKey): boolean;

  /**
   * The keys, in the order they were added; it follows later changes.
   */
  keys(): Enumerable<TKey>;

  /**
   * The values, in their keys' order; it follows later changes.
   */
  values(): Enumerable<TValue>;
}

/**
 * What can be read from a set: the contract {@link HashSet} and
 * {@link ReadOnlySet} implement, for a parameter that only reads a set.
 *
 * @template T The type of the elements.
 */
export declare interface IReadOnlySet<T> extends Enumerable<T> {
  /**
   * Tells whether `other` holds every element of this set.
   */
  isSubsetOf(other: Iterable<T>): boolean;

  /**
   * Tells whether this set holds every element of `other`.
   */
  isSupersetOf(other: Iterable<T>): boolean;

  /**
   * Tells whether this set and `other` share an element.
   */
  overlaps(other: Iterable<T>): boolean;

  /**
   * Tells whether this set and `other` hold the same elements, ignoring order and repeats.
   */
  setEquals(other: Iterable<T>): boolean;
}

/**
 * A list that can be read but not changed through this view, which
 * {@link List.asReadOnly} returns.
 *
 * @template T The type of the elements; not `undefined`, which means no element.
 *
 * @remarks
 * The view reads the list it wraps on each call, so it follows the list's
 * later changes.
 */
export declare class ReadOnlyList<T extends {} | null> extends Enumerable<T> implements IReadOnlyList<T> {
  /**
   * Creates a view that reads a list.
   *
   * @param list The list to read.
   */
  public constructor(list: IReadOnlyList<T>);

  /**
   * Starts an enumeration of the list's elements in order.
   */
  public [Symbol.iterator](): Iterator<T>;

  /**
   * The element at a zero-based position.
   *
   * @throws {ArgumentOutOfRangeException} When there is no element there.
   */
  public get(index: number): T;

  /**
   * The element at a zero-based position; `undefined` when there is none.
   */
  public tryGet(index: number): T | undefined;

  /**
   * The position of the first element equal to `item` by SameValueZero, or `-1`.
   */
  public indexOf(item: T): number;
}

/**
 * A dictionary that can be read but not changed through this view, which
 * {@link Dictionary.asReadOnly} returns.
 *
 * @template TKey The type of the keys.
 * @template TValue The type of the values; not `undefined`, which means no value.
 *
 * @remarks
 * The view reads the dictionary it wraps on each call, so it follows the
 * dictionary's later changes.
 */
export declare class ReadOnlyDictionary<TKey, TValue extends {} | null> extends Enumerable<KeyValuePair<TKey, TValue>>
  implements IReadOnlyDictionary<TKey, TValue> {
  /**
   * Creates a view that reads a dictionary.
   *
   * @param dictionary The dictionary to read.
   */
  public constructor(dictionary: IReadOnlyDictionary<TKey, TValue>);

  /**
   * Starts an enumeration of the entries in the order their keys were added.
   */
  public [Symbol.iterator](): Iterator<KeyValuePair<TKey, TValue>>;

  /**
   * The value of a key.
   *
   * @throws {KeyNotFoundException} When the dictionary has no such key.
   */
  public get(key: TKey): TValue;

  /**
   * The value of a key; `undefined` when the dictionary has no such key.
   */
  public tryGet(key: TKey): TValue | undefined;

  /**
   * Tells whether the dictionary has a key.
   */
  public containsKey(key: TKey): boolean;

  /**
   * The keys, in the order they were added; it follows later changes.
   */
  public keys(): Enumerable<TKey>;

  /**
   * The values, in their keys' order; it follows later changes.
   */
  public values(): Enumerable<TValue>;
}

/**
 * A set that can be read but not changed through this view, which
 * {@link HashSet.asReadOnly} returns.
 *
 * @template T The type of the elements.
 *
 * @remarks
 * The view reads the set it wraps on each call, so it follows the set's later
 * changes.
 */
export declare class ReadOnlySet<T> extends Enumerable<T> implements IReadOnlySet<T> {
  /**
   * Creates a view that reads a set.
   *
   * @param set The set to read.
   */
  public constructor(set: IReadOnlySet<T>);

  /**
   * Starts an enumeration of the elements in the order they were added.
   */
  public [Symbol.iterator](): Iterator<T>;

  /**
   * Tells whether `other` holds every element of this set.
   */
  public isSubsetOf(other: Iterable<T>): boolean;

  /**
   * Tells whether this set holds every element of `other`.
   */
  public isSupersetOf(other: Iterable<T>): boolean;

  /**
   * Tells whether this set and `other` share an element.
   */
  public overlaps(other: Iterable<T>): boolean;

  /**
   * Tells whether this set and `other` hold the same elements, ignoring order and repeats.
   */
  public setEquals(other: Iterable<T>): boolean;
}

/**
 * A list of elements that grows as it needs, read and written by position.
 *
 * @template T The type of the elements; not `undefined`, which means no element.
 *
 * @remarks
 * Reading or writing a position is O(1), adding at the end is amortized O(1),
 * and inserting or removing elsewhere moves the elements after it. Changing
 * the list while it is being enumerated makes the enumeration throw
 * `InvalidOperationException` at its next step.
 *
 * @example
 * ```ts
 * import { List } from "@noldova/context.collections";
 *
 * const names = new List(["Ana", "Mia"]);
 * names.add("Leo");
 * names.get(2); // "Leo"
 * names.tryGet(5); // undefined
 * names.insert(0, "Zoe");
 * names.sort();
 * names.toArray(); // ["Ana", "Mia", "Leo", "Zoe"]
 * ```
 */
export declare class List<T extends {} | null> extends Enumerable<T> implements IReadOnlyList<T> {
  /**
   * Creates a list of the given elements, copied.
   */
  public constructor(items?: Iterable<T>);

  /**
   * Starts an enumeration of the elements in order.
   */
  public [Symbol.iterator](): Iterator<T>;

  /**
   * The element at a zero-based position.
   *
   * @throws {ArgumentOutOfRangeException} When there is no element there,
   * including a negative or fractional position.
   */
  public get(index: number): T;

  /**
   * The element at a zero-based position; `undefined` when there is none.
   */
  public tryGet(index: number): T | undefined;

  /**
   * Replaces the element at a zero-based position.
   *
   * @throws {ArgumentOutOfRangeException} When there is no element there.
   */
  public set(index: number, item: T): void;

  /**
   * Adds an element at the end.
   */
  public add(item: T): void;

  /**
   * Adds elements at the end, in order. Adding the list to itself doubles it.
   */
  public addRange(items: Iterable<T>): void;

  /**
   * Inserts an element before a zero-based position; the list's length puts it at the end.
   *
   * @throws {ArgumentOutOfRangeException} When the position isn't an integer from
   * zero to the list's length.
   */
  public insert(index: number, item: T): void;

  /**
   * Inserts elements, in order, before a zero-based position.
   *
   * @throws {ArgumentOutOfRangeException} When the position isn't an integer from
   * zero to the list's length.
   */
  public insertRange(index: number, items: Iterable<T>): void;

  /**
   * Removes the first element equal to `item` by SameValueZero.
   *
   * @returns Whether an element was removed.
   */
  public remove(item: T): boolean;

  /**
   * Removes the element at a zero-based position.
   *
   * @throws {ArgumentOutOfRangeException} When there is no element there.
   */
  public removeAt(index: number): void;

  /**
   * Removes `count` elements from a zero-based position.
   *
   * @throws {ArgumentOutOfRangeException} When the position isn't an integer from
   * zero to the list's length, `count` isn't a non-negative integer, or the
   * range runs past the end.
   */
  public removeRange(index: number, count: number): void;

  /**
   * Removes every element that matches.
   *
   * @returns How many were removed.
   */
  public removeAll(predicate: (item: T) => boolean): number;

  /**
   * Removes every element.
   */
  public clear(): void;

  /**
   * The position of the first element equal to `item` by SameValueZero, or `-1`.
   */
  public indexOf(item: T): number;

  /**
   * The position of the last element equal to `item` by SameValueZero, or `-1`.
   */
  public lastIndexOf(item: T): number;

  /**
   * Sorts the list in place, keeping the order of equal elements. `orderBy`
   * is the deferred form that leaves the list as it is.
   *
   * @param comparison The order. Omitted, it is {@link Comparer.compare}.
   */
  public sort(comparison?: Comparison<T>): void;

  /**
   * Finds an item's position in the list, which must be sorted by `comparison`, as
   * {@link BinarySearchService.search} does.
   *
   * @param item The item to find.
   * @param comparison The order. Omitted, it is {@link Comparer.compare}.
   * @returns The position of an item the comparison finds equal, or the bitwise complement (`~`)
   * of the position where the item would be inserted to keep the order.
   */
  public binarySearch(item: T, comparison?: Comparison<T>): number;

  /**
   * Returns a view that reads this list, follows its changes and can't change it.
   */
  public asReadOnly(): ReadOnlyList<T>;
}

/**
 * A list held in chunks, for long lists that are mostly one value and for
 * sums of the elements' weights over a range.
 *
 * @template T The type of the elements; not `undefined`, which means no element.
 *
 * @remarks
 * The elements are kept in chunks of at most `chunkSize`. A chunk that holds
 * only the fill value it was created with takes no storage until an element
 * in it is set, so a list of a million fill values holds only its chunks'
 * lengths. Each chunk keeps the sum of its elements' weights, so the total
 * weight is O(1), and the weight before a position and the next or previous
 * weighted element take O(chunks) plus O(chunkSize), skipping chunks whose
 * weight is 0. Reading or setting a position is O(log chunks), plus
 * O(chunkSize) the first time a fill chunk is set. Inserting or removing
 * copies only the kept ends of the first and last chunks it touches, drops
 * the chunks it removes whole without reading them, and renumbers the chunks
 * in O(chunks). The rebuilt elements split into chunks of nearly equal size,
 * and a chunk left with fewer than half of `chunkSize` joins a neighbour, so
 * the chunk count stays near the length over `chunkSize`. A change that
 * weighs an element whose weight isn't a finite number that isn't negative
 * throws `ArgumentOutOfRangeException` and leaves the list as it was.
 * Changing the list while it is
 * being enumerated makes the enumeration throw `InvalidOperationException` at
 * its next step.
 *
 * @example
 * ```ts
 * import { ChunkedList } from "@noldova/context.collections";
 *
 * const matches = new ChunkedList<number>(1024, 0, 100_000, t => t);
 * matches.set(10, 2);
 * matches.set(500, 3);
 * matches.totalWeight; // 5
 * matches.weightBefore(500); // 2
 * matches.nextWeightedIndex(11); // 500
 * matches.previousWeightedIndex(500); // 10
 * matches.insertRange(0, [0, 0]);
 * matches.nextWeightedIndex(0); // 12
 * ```
 */
export declare class ChunkedList<T extends {} | null> extends Enumerable<T> implements IReadOnlyList<T> {
  /**
   * Creates a list of `length` fill values.
   *
   * @param chunkSize The most elements a chunk holds.
   * @param fill The value of every element at the start; chunks that hold
   * only it take no storage.
   * @param length How many elements the list starts with. Omitted, it is 0.
   * @param weigh An element's weight, a finite number that isn't negative.
   * Omitted, every element weighs 0.
   * @throws {ArgumentOutOfRangeException} When `chunkSize` isn't a positive
   * integer, `length` isn't a non-negative integer, or `length` is positive
   * and the fill value's weight isn't a finite number that isn't negative.
   */
  public constructor(chunkSize: number, fill: T, length?: number, weigh?: (item: T) => number);

  /**
   * The sum of every element's weight.
   */
  public get totalWeight(): number;

  /**
   * Starts an enumeration of the elements in order.
   */
  public [Symbol.iterator](): Iterator<T>;

  /**
   * The element at a zero-based position.
   *
   * @throws {ArgumentOutOfRangeException} When there is no element there,
   * including a negative or fractional position.
   */
  public get(index: number): T;

  /**
   * The element at a zero-based position; `undefined` when there is none.
   */
  public tryGet(index: number): T | undefined;

  /**
   * Replaces the element at a zero-based position, and its weight in the sums.
   *
   * @throws {ArgumentOutOfRangeException} When there is no element there, or
   * the element's weight isn't a finite number that isn't negative.
   */
  public set(index: number, item: T): void;

  /**
   * Adds an element at the end.
   */
  public add(item: T): void;

  /**
   * Adds elements at the end, in order.
   */
  public addRange(items: Iterable<T>): void;

  /**
   * Inserts an element before a zero-based position; the list's length puts it at the end.
   *
   * @throws {ArgumentOutOfRangeException} When the position isn't an integer from
   * zero to the list's length.
   */
  public insert(index: number, item: T): void;

  /**
   * Inserts elements, in order, before a zero-based position.
   *
   * @throws {ArgumentOutOfRangeException} When the position isn't an integer from
   * zero to the list's length.
   */
  public insertRange(index: number, items: Iterable<T>): void;

  /**
   * Removes the first element equal to `item` by SameValueZero.
   *
   * @returns Whether an element was removed.
   */
  public remove(item: T): boolean;

  /**
   * Removes the element at a zero-based position.
   *
   * @throws {ArgumentOutOfRangeException} When there is no element there.
   */
  public removeAt(index: number): void;

  /**
   * Removes `count` elements from a zero-based position.
   *
   * @throws {ArgumentOutOfRangeException} When the position isn't an integer from
   * zero to the list's length, `count` isn't a non-negative integer, or the
   * range runs past the end.
   */
  public removeRange(index: number, count: number): void;

  /**
   * Removes every element that matches. The elements left all hold storage.
   *
   * @returns How many were removed.
   */
  public removeAll(predicate: (item: T) => boolean): number;

  /**
   * Removes every element.
   */
  public clear(): void;

  /**
   * The position of the first element equal to `item` by SameValueZero, or `-1`.
   */
  public indexOf(item: T): number;

  /**
   * The position of the last element equal to `item` by SameValueZero, or `-1`.
   */
  public lastIndexOf(item: T): number;

  /**
   * Sorts the list in place, keeping the order of equal elements. The
   * elements then all hold storage.
   *
   * @param comparison The order. Omitted, it is {@link Comparer.compare}.
   */
  public sort(comparison?: Comparison<T>): void;

  /**
   * Finds an item's position in the list, which must be sorted by `comparison`, as
   * {@link BinarySearchService.search} does.
   *
   * @param item The item to find.
   * @param comparison The order. Omitted, it is {@link Comparer.compare}.
   * @returns The position of an item the comparison finds equal, or the bitwise complement (`~`)
   * of the position where the item would be inserted to keep the order.
   */
  public binarySearch(item: T, comparison?: Comparison<T>): number;

  /**
   * Returns a view that reads this list, follows its changes and can't change it.
   */
  public asReadOnly(): ReadOnlyList<T>;

  /**
   * The sum of the weights of the elements before a zero-based position.
   *
   * @throws {ArgumentOutOfRangeException} When the position isn't an integer from
   * zero to the list's length.
   */
  public weightBefore(index: number): number;

  /**
   * The first position from `index` on whose element weighs more than 0, or `-1`.
   *
   * @throws {ArgumentOutOfRangeException} When the position isn't an integer from
   * zero to the list's length.
   */
  public nextWeightedIndex(index: number): number;

  /**
   * The last position before `index` whose element weighs more than 0, or `-1`.
   *
   * @throws {ArgumentOutOfRangeException} When the position isn't an integer from
   * zero to the list's length.
   */
  public previousWeightedIndex(index: number): number;
}

/**
 * Values stored by key.
 *
 * @template TKey The type of the keys.
 * @template TValue The type of the values; not `undefined`, which means no value.
 *
 * @remarks
 * With the default equality, SameValueZero, lookups are O(1) on a native
 * `Map`; a custom {@link IEqualityComparer} hashes keys into buckets. The
 * dictionary enumerates its entries in the order their keys were added, which
 * replacing a value keeps. Changing it while it is being enumerated makes the
 * enumeration throw `InvalidOperationException` at its next step.
 *
 * @example
 * ```ts
 * import { Dictionary } from "@noldova/context.collections";
 *
 * const ages = new Dictionary<string, number>();
 * ages.add("Ana", 31);
 * ages.set("Ana", 32);
 * ages.get("Ana"); // 32
 * ages.tryGet("Mia"); // undefined
 * ages.get("Mia"); // throws KeyNotFoundException
 * for (const { key, value } of ages) console.log(key, value);
 * ```
 */
export declare class Dictionary<TKey, TValue extends {} | null> extends Enumerable<KeyValuePair<TKey, TValue>>
  implements IReadOnlyDictionary<TKey, TValue> {
  /**
   * Creates a dictionary of the given entries.
   *
   * @param entries The entries to add, in order.
   * @param comparer The key equality. Omitted, it is SameValueZero.
   * @throws {ArgumentException} When two entries have equal keys.
   */
  public constructor(entries?: Iterable<KeyValuePair<TKey, TValue>>, comparer?: IEqualityComparer<TKey>);

  /**
   * Starts an enumeration of the entries in the order their keys were added.
   */
  public [Symbol.iterator](): Iterator<KeyValuePair<TKey, TValue>>;

  /**
   * The value of a key.
   *
   * @throws {KeyNotFoundException} When the dictionary has no such key.
   */
  public get(key: TKey): TValue;

  /**
   * The value of a key; `undefined` when the dictionary has no such key.
   */
  public tryGet(key: TKey): TValue | undefined;

  /**
   * Adds a key with its value, or replaces the value of a key it has.
   */
  public set(key: TKey, value: TValue): void;

  /**
   * Adds a key with its value.
   *
   * @throws {ArgumentException} When the dictionary already has the key.
   */
  public add(key: TKey, value: TValue): void;

  /**
   * Adds a key with its value unless the dictionary already has the key.
   *
   * @returns Whether it was added.
   */
  public tryAdd(key: TKey, value: TValue): boolean;

  /**
   * Removes a key and its value.
   *
   * @returns Whether the key was there.
   */
  public remove(key: TKey): boolean;

  /**
   * Tells whether the dictionary has a key.
   */
  public containsKey(key: TKey): boolean;

  /**
   * Tells whether a value equals `value` by SameValueZero. It reads every value.
   */
  public containsValue(value: TValue): boolean;

  /**
   * The keys, in the order they were added; it follows later changes.
   */
  public keys(): Enumerable<TKey>;

  /**
   * The values, in their keys' order; it follows later changes.
   */
  public values(): Enumerable<TValue>;

  /**
   * Removes every entry.
   */
  public clear(): void;

  /**
   * Returns a view that reads this dictionary, follows its changes and can't change it.
   */
  public asReadOnly(): ReadOnlyDictionary<TKey, TValue>;
}

/**
 * A set of distinct elements.
 *
 * @template T The type of the elements.
 *
 * @remarks
 * Equality and speed are a {@link Dictionary}'s: O(1) on a native `Map` by
 * default, hashed buckets with a custom {@link IEqualityComparer}. The set
 * enumerates its elements in the order they were added. The `…With` methods
 * change this set; `union`, `intersect` and `except` return new sequences.
 *
 * @example
 * ```ts
 * import { HashSet } from "@noldova/context.collections";
 *
 * const tags = new HashSet(["a", "b"]);
 * tags.add("a"); // false: already there.
 * tags.unionWith(["c"]);
 * tags.isSupersetOf(["a", "c"]); // true
 * ```
 */
export declare class HashSet<T> extends Enumerable<T> implements IReadOnlySet<T> {
  /**
   * Creates a set of the given elements, keeping the first of equal ones.
   *
   * @param comparer The equality. Omitted, it is SameValueZero.
   */
  public constructor(items?: Iterable<T>, comparer?: IEqualityComparer<T>);

  /**
   * Starts an enumeration of the elements in the order they were added.
   */
  public [Symbol.iterator](): Iterator<T>;

  /**
   * Adds an element.
   *
   * @returns False when the set already holds an equal element, which stays.
   */
  public add(item: T): boolean;

  /**
   * Removes an element.
   *
   * @returns Whether it was there.
   */
  public remove(item: T): boolean;

  /**
   * Removes every element.
   */
  public clear(): void;

  /**
   * Adds every element of `other`.
   */
  public unionWith(other: Iterable<T>): void;

  /**
   * Keeps only the elements `other` also holds.
   */
  public intersectWith(other: Iterable<T>): void;

  /**
   * Removes every element `other` holds.
   */
  public exceptWith(other: Iterable<T>): void;

  /**
   * Keeps the elements that are in this set or `other` but not both.
   */
  public symmetricExceptWith(other: Iterable<T>): void;

  /**
   * Tells whether `other` holds every element of this set.
   */
  public isSubsetOf(other: Iterable<T>): boolean;

  /**
   * Tells whether this set holds every element of `other`.
   */
  public isSupersetOf(other: Iterable<T>): boolean;

  /**
   * Tells whether this set and `other` share an element.
   */
  public overlaps(other: Iterable<T>): boolean;

  /**
   * Tells whether this set and `other` hold the same elements, ignoring order and repeats.
   */
  public setEquals(other: Iterable<T>): boolean;

  /**
   * Returns a view that reads this set, follows its changes and can't change it.
   */
  public asReadOnly(): ReadOnlySet<T>;
}

/**
 * First in, first out.
 *
 * @template T The type of the elements; not `undefined`, which means no element.
 *
 * @remarks
 * Elements live in a ring buffer that doubles when full, so every operation is
 * O(1), amortized for `enqueue`. The queue enumerates from front to back.
 *
 * @example
 * ```ts
 * import { Queue } from "@noldova/context.collections";
 *
 * const jobs = new Queue(["a", "b"]);
 * jobs.enqueue("c");
 * jobs.dequeue(); // "a"
 * jobs.peek(); // "b"
 * ```
 */
export declare class Queue<T extends {} | null> extends Enumerable<T> {
  /**
   * Creates a queue of the given elements, the first at the front.
   */
  public constructor(items?: Iterable<T>);

  /**
   * Starts an enumeration of the elements from front to back.
   */
  public [Symbol.iterator](): Iterator<T>;

  /**
   * Adds an element at the back.
   */
  public enqueue(item: T): void;

  /**
   * Removes and returns the front element.
   *
   * @throws {InvalidOperationException} When the queue is empty.
   */
  public dequeue(): T;

  /**
   * Removes and returns the front element; `undefined` when the queue is empty.
   */
  public tryDequeue(): T | undefined;

  /**
   * Returns the front element without removing it.
   *
   * @throws {InvalidOperationException} When the queue is empty.
   */
  public peek(): T;

  /**
   * Returns the front element; `undefined` when the queue is empty.
   */
  public tryPeek(): T | undefined;

  /**
   * Removes every element.
   */
  public clear(): void;
}

/**
 * Last in, first out.
 *
 * @template T The type of the elements; not `undefined`, which means no element.
 *
 * @remarks
 * The stack enumerates from top to bottom, the order `pop` would return.
 *
 * @example
 * ```ts
 * import { Stack } from "@noldova/context.collections";
 *
 * const undo = new Stack(["type", "bold"]);
 * undo.push("delete");
 * undo.pop(); // "delete"
 * undo.toArray(); // ["bold", "type"]
 * ```
 */
export declare class Stack<T extends {} | null> extends Enumerable<T> {
  /**
   * Creates a stack of the given elements, pushed in order, so the last is on top.
   */
  public constructor(items?: Iterable<T>);

  /**
   * Starts an enumeration of the elements from top to bottom.
   */
  public [Symbol.iterator](): Iterator<T>;

  /**
   * Puts an element on top.
   */
  public push(item: T): void;

  /**
   * Removes and returns the top element.
   *
   * @throws {InvalidOperationException} When the stack is empty.
   */
  public pop(): T;

  /**
   * Removes and returns the top element; `undefined` when the stack is empty.
   */
  public tryPop(): T | undefined;

  /**
   * Returns the top element without removing it.
   *
   * @throws {InvalidOperationException} When the stack is empty.
   */
  public peek(): T;

  /**
   * Returns the top element; `undefined` when the stack is empty.
   */
  public tryPeek(): T | undefined;

  /**
   * Removes every element.
   */
  public clear(): void;
}
