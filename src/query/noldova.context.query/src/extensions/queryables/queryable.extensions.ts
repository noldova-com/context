/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Expression, type LambdaExpression } from "@noldova/context.query.expressions";

import { QueryMethod } from "../../enums/query-method.js";
import { OrderedQueryable } from "../../models/ordered-queryable.js";
import { Queryable } from "../../models/queryable.js";

declare module "../../models/queryable.js" {
  interface Queryable<T> {
    orderBy<TKey>(key: LambdaExpression<(item: T) => TKey>): OrderedQueryable<T>;
    orderByDescending<TKey>(key: LambdaExpression<(item: T) => TKey>): OrderedQueryable<T>;
  }
}

Queryable.prototype.orderBy = function <T, TKey>(this: Queryable<T>, key: LambdaExpression<(item: T) => TKey>): OrderedQueryable<T> {
  return new OrderedQueryable<T>(this.provider, Expression.call(this.expression, QueryMethod.OrderBy, [key]));
};

Queryable.prototype.orderByDescending = function <T, TKey>(this: Queryable<T>, key: LambdaExpression<(item: T) => TKey>): OrderedQueryable<T> {
  return new OrderedQueryable<T>(this.provider, Expression.call(this.expression, QueryMethod.OrderByDescending, [key]));
};
