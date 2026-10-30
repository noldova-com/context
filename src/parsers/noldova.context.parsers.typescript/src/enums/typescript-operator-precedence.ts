/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export enum TypeScriptOperatorPrecedence {
  None = 0,
  NullishCoalescing = 5,
  LogicalOr = 5,
  LogicalAnd = 6,
  BitwiseOr = 7,
  BitwiseXor = 8,
  BitwiseAnd = 9,
  Equality = 10,
  Relational = 11,
  Shift = 12,
  Additive = 13,
  Multiplicative = 14,
  Exponentiation = 15
}
