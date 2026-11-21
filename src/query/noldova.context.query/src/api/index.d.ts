/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Expression, LambdaExpression } from "@noldova/context.query.expressions";

/**
 * Runs queries: it takes a query's expression tree and returns its result,
 * running the tree in memory, translating it to another language such as SQL,
 * or rejecting what it can't run.
 *
 * A query's tree is its source, usually a constant, followed by one
 * `CallExpression` for each operator, named as the {@link Queryable}
 * method that added it, such as `where` or `toArray`.
 */
export declare abstract class QueryProvider {
  /**
   * Runs a query that ends in a result, such as `toArray` or `count`.
   *
   * @template TResult The type of the result.
   * @param expression The query's tree, ending in the call that asks for the result.
   * @returns A promise of the result; it rejects with whatever running the query throws.
   */
  public abstract executeAsync<TResult>(expression: Expression): Promise<TResult>;

  /**
   * Runs a query and returns its items one by one, as `for await` over a
   * {@link Queryable} reads them.
   *
   * @template T The type of an item.
   * @param expression The query's tree.
   * @returns The query's items.
   */
  public abstract iterate<T>(expression: Expression): AsyncIterable<T>;
}

/**
 * A query: an expression tree and the provider that runs it. A query is
 * immutable; each operator returns a new query whose tree ends in one more
 * call. Nothing runs until a method ending in `Async` is called or `for await`
 * reads the query.
 *
 * Predicates, keys and projections are lambdas, built with the factories of
 * `@noldova/context.query.expressions`.
 *
 * @template T The type of an item.
 * @example
 * ```ts
 * import { BinaryOperator, Expression } from "@noldova/context.query.expressions";
 * import { InMemoryQueryProvider } from "@noldova/context.query";
 *
 * class Person {
 *   public readonly name: string;
 *   public readonly age: number;
 *
 *   public constructor(name: string, age: number) {
 *     this.name = name;
 *     this.age = age;
 *   }
 * }
 *
 * const people = new InMemoryQueryProvider().from([new Person("Ana", 34), new Person("Ion", 17)]);
 * const person = Expression.parameter("person");
 * const adults = people.where(Expression.lambda<(person: Person) => boolean>([person],
 *   Expression.binary(BinaryOperator.GreaterThanOrEqual, Expression.member(person, "age"), Expression.constant(18))));
 *
 * await adults.countAsync(); // 1
 * for await (const adult of adults)
 *   console.log(adult.name); // "Ana"
 * ```
 */
export declare class Queryable<T> implements AsyncIterable<T> {
  /**
   * The provider that runs this query.
   */
  public readonly provider: QueryProvider;

  /**
   * This query's tree.
   */
  public readonly expression: Expression;

  /**
   * Creates a query. A provider calls this for the source of its queries;
   * the operators create every other query.
   *
   * @param provider The provider that runs the query.
   * @param expression The query's tree.
   */
  public constructor(provider: QueryProvider, expression: Expression);

  /**
   * Runs this query and returns its items one by one, for `for await`. As in
   * any `for await`, an item that is a promise is awaited, so the loop sees the
   * value it settles to, while {@link toArrayAsync} returns the promise itself.
   *
   * @returns An iterator over the query's items.
   */
  public [Symbol.asyncIterator](): AsyncIterator<T>;

  /**
   * Keeps only the items the predicate is true for.
   *
   * @param predicate A lambda from an item to whether to keep it.
   * @returns The filtered query.
   */
  public where(predicate: LambdaExpression<(item: T) => boolean>): Queryable<T>;

  /**
   * Replaces each item with the selector's result for it.
   *
   * @template TResult The type of a result.
   * @param selector A lambda from an item to its result.
   * @returns The projected query.
   */
  public select<TResult>(selector: LambdaExpression<(item: T) => TResult>): Queryable<TResult>;

  /**
   * Sorts the items by a key, ascending; ties keep their order.
   *
   * @template TKey The type of the key.
   * @param key A lambda from an item to its key.
   * @returns The sorted query, which {@link OrderedQueryable.thenBy} sorts further.
   */
  public orderBy<TKey>(key: LambdaExpression<(item: T) => TKey>): OrderedQueryable<T>;

  /**
   * Sorts the items by a key, descending; ties keep their order.
   *
   * @template TKey The type of the key.
   * @param key A lambda from an item to its key.
   * @returns The sorted query, which {@link OrderedQueryable.thenBy} sorts further.
   */
  public orderByDescending<TKey>(key: LambdaExpression<(item: T) => TKey>): OrderedQueryable<T>;

  /**
   * Leaves out the first items.
   *
   * @param count How many items to leave out.
   * @returns The query without those items.
   */
  public skip(count: number): Queryable<T>;

  /**
   * Keeps only the first items.
   *
   * @param count How many items to keep.
   * @returns The query with at most that many items.
   */
  public take(count: number): Queryable<T>;

  /**
   * Runs this query and returns its items.
   *
   * @returns A promise of the items, in order.
   */
  public toArrayAsync(): Promise<T[]>;

  /**
   * Runs this query and returns its first item.
   *
   * @returns A promise of the first item; it rejects with `InvalidOperationException` when there is none.
   */
  public firstAsync(): Promise<T>;

  /**
   * Runs this query and returns its first item, or `undefined` when there is none.
   *
   * @returns A promise of the first item or `undefined`.
   */
  public firstOrDefaultAsync(): Promise<T | undefined>;

  /**
   * Runs this query and returns its only item.
   *
   * @returns A promise of the only item; it rejects with `InvalidOperationException` when there is none or more than one.
   */
  public singleAsync(): Promise<T>;

  /**
   * Runs this query and returns its only item, or `undefined` when there is none.
   *
   * @returns A promise of the only item or `undefined`; it rejects with `InvalidOperationException` when there is more than one.
   */
  public singleOrDefaultAsync(): Promise<T | undefined>;

  /**
   * Runs this query and returns whether it has any item.
   *
   * @returns A promise of whether the query has an item.
   */
  public anyAsync(): Promise<boolean>;

  /**
   * Runs this query and returns how many items it has.
   *
   * @returns A promise of the number of items.
   */
  public countAsync(): Promise<number>;
}

/**
 * A sorted query, which further keys sort where the earlier keys tie.
 *
 * @template T The type of an item.
 */
export declare class OrderedQueryable<T> extends Queryable<T> {
  /**
   * Sorts the items that tie on the earlier keys by another key, ascending.
   *
   * @template TKey The type of the key.
   * @param key A lambda from an item to its key.
   * @returns The sorted query.
   */
  public thenBy<TKey>(key: LambdaExpression<(item: T) => TKey>): OrderedQueryable<T>;

  /**
   * Sorts the items that tie on the earlier keys by another key, descending.
   *
   * @template TKey The type of the key.
   * @param key A lambda from an item to its key.
   * @returns The sorted query.
   */
  public thenByDescending<TKey>(key: LambdaExpression<(item: T) => TKey>): OrderedQueryable<T>;
}

/**
 * Runs queries over items in memory, with the query operators of
 * `@noldova/context.collections`' `Enumerable`. A query's lambdas are compiled
 * once to functions, without `eval` or `new Function`, and evaluated as
 * TypeScript evaluates the code they describe, with these limits:
 *
 * - `-`, `*` and `/` need two numbers or two bigints, and `+` also takes a
 *   string on either side; a comparison needs two numbers or bigints, two
 *   strings or two dates. Other operands reject with `InvalidOperationException`.
 * - Reading a member of `null` or `undefined`, or calling a member that isn't a
 *   function, rejects with `TypeError`.
 * - A parameter used outside the lambda that declares it, or a property outside
 *   its object, rejects with `InvalidOperationException`.
 * - A chain of `&&`, `||` or `??` can be of any length; other nesting is
 *   supported to 1,000 levels, and a deeper tree may exceed the host's stack.
 *
 * @see {@link Queryable} for an example.
 */
export declare class InMemoryQueryProvider extends QueryProvider {
  /**
   * Creates a query over items in memory.
   *
   * @template T The type of an item.
   * @param source The items, such as an array; they are read each time the query runs.
   * @returns A query over the items.
   */
  public from<T>(source: Iterable<T>): Queryable<T>;

  /**
   * Runs a query that ends in a result.
   *
   * @template TResult The type of the result.
   * @param expression The query's tree, ending in the call that asks for the result.
   * @returns A promise of the result.
   */
  public override executeAsync<TResult>(expression: Expression): Promise<TResult>;

  /**
   * Runs a query and returns its items one by one.
   *
   * @template T The type of an item.
   * @param expression The query's tree.
   * @returns The query's items.
   */
  public override iterate<T>(expression: Expression): AsyncIterable<T>;
}
