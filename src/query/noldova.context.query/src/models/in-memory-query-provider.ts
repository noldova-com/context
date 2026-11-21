/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Enumerable } from "@noldova/context.collections";
import { Expression } from "@noldova/context.query.expressions";

import { CompileScope } from "./compile-scope.js";
import { Frame } from "./frame.js";
import { QueryProvider } from "./query-provider.js";
import { Queryable } from "./queryable.js";

export class InMemoryQueryProvider extends QueryProvider {
  public from<T>(source: Iterable<T>): Queryable<T> {
    return new Queryable<T>(this, Expression.constant(Enumerable.from(source)));
  }

  public override async executeAsync<TResult>(expression: Expression): Promise<TResult> {
    return InMemoryQueryProvider.evaluate<TResult>(expression);
  }

  public override async *iterate<T>(expression: Expression): AsyncIterable<T> {
    yield* InMemoryQueryProvider.evaluate<Iterable<T>>(expression);
  }

  private static evaluate<TResult>(expression: Expression): TResult {
    return expression.compile(CompileScope.ROOT)(Frame.ROOT) as TResult;
  }
}
