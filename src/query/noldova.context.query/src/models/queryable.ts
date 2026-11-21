/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Expression, type LambdaExpression } from "@noldova/context.query.expressions";

import { QueryMethod } from "../enums/query-method.js";
import type { QueryProvider } from "./query-provider.js";

export class Queryable<T> implements AsyncIterable<T> {
  public readonly provider: QueryProvider;
  public readonly expression: Expression;

  public constructor(provider: QueryProvider, expression: Expression) {
    this.provider = provider;
    this.expression = expression;
  }

  public [Symbol.asyncIterator](): AsyncIterator<T> {
    return this.provider.iterate<T>(this.expression)[Symbol.asyncIterator]();
  }

  public where(predicate: LambdaExpression<(item: T) => boolean>): Queryable<T> {
    return new Queryable<T>(this.provider, Expression.call(this.expression, QueryMethod.Where, [predicate]));
  }

  public select<TResult>(selector: LambdaExpression<(item: T) => TResult>): Queryable<TResult> {
    return new Queryable<TResult>(this.provider, Expression.call(this.expression, QueryMethod.Select, [selector]));
  }

  public skip(count: number): Queryable<T> {
    return new Queryable<T>(this.provider, Expression.call(this.expression, QueryMethod.Skip, [Expression.constant(count)]));
  }

  public take(count: number): Queryable<T> {
    return new Queryable<T>(this.provider, Expression.call(this.expression, QueryMethod.Take, [Expression.constant(count)]));
  }

  public toArrayAsync(): Promise<T[]> {
    return this.executeAsync<T[]>(QueryMethod.ToArray);
  }

  public firstAsync(): Promise<T> {
    return this.executeAsync<T>(QueryMethod.First);
  }

  public firstOrDefaultAsync(): Promise<T | undefined> {
    return this.executeAsync<T | undefined>(QueryMethod.FirstOrDefault);
  }

  public singleAsync(): Promise<T> {
    return this.executeAsync<T>(QueryMethod.Single);
  }

  public singleOrDefaultAsync(): Promise<T | undefined> {
    return this.executeAsync<T | undefined>(QueryMethod.SingleOrDefault);
  }

  public anyAsync(): Promise<boolean> {
    return this.executeAsync<boolean>(QueryMethod.Any);
  }

  public countAsync(): Promise<number> {
    return this.executeAsync<number>(QueryMethod.Count);
  }

  private executeAsync<TResult>(method: QueryMethod): Promise<TResult> {
    return this.provider.executeAsync<TResult>(Expression.call(this.expression, method, []));
  }
}
