/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { InvalidOperationException } from "@noldova/context.exceptions";
import { BinaryExpression, BinaryOperator, type Expression } from "@noldova/context.query.expressions";

import { Resources } from "../resources.js";
import type { ShortCircuitOperator } from "../types/short-circuit-operator.js";

export class OperatorService {
  public static readonly OPERATIONS: Readonly<Record<Exclude<BinaryOperator, ShortCircuitOperator>, (left: unknown, right: unknown) => unknown>> = {
    [BinaryOperator.Add]: OperatorService.add,
    [BinaryOperator.Subtract]: (left: unknown, right: unknown): unknown => OperatorService.arithmetic(left, right, (a: number, b: number): number => a - b, (a: bigint, b: bigint): bigint => a - b),
    [BinaryOperator.Multiply]: (left: unknown, right: unknown): unknown => OperatorService.arithmetic(left, right, (a: number, b: number): number => a * b, (a: bigint, b: bigint): bigint => a * b),
    [BinaryOperator.Divide]: (left: unknown, right: unknown): unknown => OperatorService.arithmetic(left, right, (a: number, b: number): number => a / b, (a: bigint, b: bigint): bigint => a / b),
    [BinaryOperator.Equal]: (left: unknown, right: unknown): boolean => left === right,
    [BinaryOperator.NotEqual]: (left: unknown, right: unknown): boolean => left !== right,
    [BinaryOperator.LessThan]: (left: unknown, right: unknown): boolean => OperatorService.compare(left, right, (a: number | bigint, b: number | bigint): boolean => a < b, (a: string, b: string): boolean => a < b),
    [BinaryOperator.LessThanOrEqual]: (left: unknown, right: unknown): boolean => OperatorService.compare(left, right, (a: number | bigint, b: number | bigint): boolean => a <= b, (a: string, b: string): boolean => a <= b),
    [BinaryOperator.GreaterThan]: (left: unknown, right: unknown): boolean => OperatorService.compare(left, right, (a: number | bigint, b: number | bigint): boolean => a > b, (a: string, b: string): boolean => a > b),
    [BinaryOperator.GreaterThanOrEqual]: (left: unknown, right: unknown): boolean => OperatorService.compare(left, right, (a: number | bigint, b: number | bigint): boolean => a >= b, (a: string, b: string): boolean => a >= b)
  };

  public static readonly STOPS: Readonly<Record<ShortCircuitOperator, (value: unknown) => boolean>> = {
    [BinaryOperator.And]: (value: unknown): boolean => !value,
    [BinaryOperator.Or]: (value: unknown): boolean => Boolean(value),
    [BinaryOperator.Coalesce]: (value: unknown): boolean => !Object.isNullOrUndefined(value)
  };

  public static isShortCircuit(operator: BinaryOperator): operator is ShortCircuitOperator {
    return operator === BinaryOperator.And || operator === BinaryOperator.Or || operator === BinaryOperator.Coalesce;
  }

  public static operandsOf(chain: BinaryExpression): Expression[] {
    const operands: Expression[] = [];
    const pending: Expression[] = [chain];
    for (let node = pending.pop(); !Object.isUndefined(node); node = pending.pop()) {
      if (node instanceof BinaryExpression && node.operator === chain.operator)
        pending.push(node.right, node.left);
      else
        operands.push(node);
    }

    return operands;
  }

  private static add(left: unknown, right: unknown): unknown {
    if (Object.isString(left) || Object.isString(right))
      return `${left}${right}`;

    return OperatorService.arithmetic(left, right, (a: number, b: number): number => a + b, (a: bigint, b: bigint): bigint => a + b);
  }

  private static arithmetic(left: unknown, right: unknown, numbers: (left: number, right: number) => number, bigints: (left: bigint, right: bigint) => bigint): unknown {
    if (Object.isNumber(left) && Object.isNumber(right))
      return numbers(left, right);

    if (Object.isBigInt(left) && Object.isBigInt(right))
      return bigints(left, right);

    throw new InvalidOperationException(Resources.arithmeticOperandsInvalid);
  }

  private static compare(left: unknown, right: unknown, numbers: (left: number | bigint, right: number | bigint) => boolean, strings: (left: string, right: string) => boolean): boolean {
    if (OperatorService.isNumeric(left) && OperatorService.isNumeric(right))
      return numbers(left, right);

    if (Object.isString(left) && Object.isString(right))
      return strings(left, right);

    if (left instanceof Date && right instanceof Date)
      return numbers(left.getTime(), right.getTime());

    throw new InvalidOperationException(Resources.comparisonOperandsInvalid);
  }

  private static isNumeric(value: unknown): value is number | bigint {
    return Object.isNumber(value) || Object.isBigInt(value);
  }
}
