/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Expression, type LambdaExpression } from "@noldova/context.query.expressions";

import { QueryMethod } from "../enums/query-method.js";
import { Queryable } from "./queryable.js";

export class OrderedQueryable<T> extends Queryable<T> {
  public thenBy<TKey>(key: LambdaExpression<(item: T) => TKey>): OrderedQueryable<T> {
    return new OrderedQueryable<T>(this.provider, Expression.call(this.expression, QueryMethod.ThenBy, [key]));
  }

  public thenByDescending<TKey>(key: LambdaExpression<(item: T) => TKey>): OrderedQueryable<T> {
    return new OrderedQueryable<T>(this.provider, Expression.call(this.expression, QueryMethod.ThenByDescending, [key]));
  }
}
