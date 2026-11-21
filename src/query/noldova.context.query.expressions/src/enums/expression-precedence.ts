/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export enum ExpressionPrecedence {
  Lambda = 0,
  Conditional = 1,
  NullishCoalescing = 2,
  LogicalOr = 3,
  LogicalAnd = 4,
  Equality = 5,
  Relational = 6,
  Additive = 7,
  Multiplicative = 8,
  Unary = 9,
  Member = 10,
  Primary = 11
}
