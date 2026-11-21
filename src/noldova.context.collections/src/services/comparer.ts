/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { ArgumentException } from "@noldova/context.exceptions";

import { Resources } from "../resources.js";
import type { Comparison } from "../types/comparison.js";

export class Comparer {
  public static compare<T>(left: T, right: T): number {
    if (left === right)
      return 0;
    if (Object.isUndefined(left))
      return -1;
    if (Object.isUndefined(right))
      return 1;
    if (Object.isNull(left))
      return -1;
    if (Object.isNull(right))
      return 1;
    if (Object.isNumber(left) && Object.isNumber(right))
      return Comparer.compareNumbers(left, right);
    if (Object.isBigInt(left) && Object.isBigInt(right))
      return left < right ? -1 : 1;
    if (Object.isString(left) && Object.isString(right))
      return left < right ? -1 : 1;
    if (Object.isBoolean(left) && Object.isBoolean(right))
      return left ? 1 : -1;
    if (left instanceof Date && right instanceof Date)
      return Comparer.compareNumbers(left.getTime(), right.getTime());

    throw new ArgumentException(Resources.notComparable, Resources.leftParameterName);
  }

  public static descending<T>(comparison: Comparison<T>): Comparison<T> {
    return (left: T, right: T): number => comparison(right, left);
  }

  private static compareNumbers(left: number, right: number): number {
    if (left < right)
      return -1;
    if (left > right)
      return 1;
    if (Number.isNaN(left))
      return Number.isNaN(right) ? 0 : -1;

    return Number.isNaN(right) ? 1 : 0;
  }
}
