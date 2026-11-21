/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { ExpressionPrecedence } from "../../enums/expression-precedence.js";
import { Expression } from "./expression.js";

export class ConstantExpression extends Expression {
  private static readonly ANONYMOUS_NAME: string = "anonymous";
  private static readonly NEGATIVE_ZERO: string = "-0";
  private static readonly OBJECT_NAME: string = "Object";

  public readonly value: unknown;

  public constructor(value: unknown) {
    super();
    this.value = value;
  }

  protected override get precedence(): ExpressionPrecedence {
    return Object.isNumber(this.value) || Object.isBigInt(this.value) ? ExpressionPrecedence.Unary : ExpressionPrecedence.Primary;
  }

  protected override replaceChildren(): Expression {
    return this;
  }

  protected override write(): string {
    const value = this.value;
    if (Object.isString(value))
      return JSON.stringify(value);

    if (Object.isBigInt(value))
      return `${value}n`;

    if (Object.isNumber(value))
      return Object.is(value, -0) ? ConstantExpression.NEGATIVE_ZERO : String(value);

    if (Object.isFunction(value))
      return ConstantExpression.nameOf(value);

    if (Object.isObject(value))
      return `[${ConstantExpression.nameClassOf(value)}]`;

    return String(value);
  }

  private static nameClassOf(value: object): string {
    const prototype: unknown = Object.getPrototypeOf(value);
    return Object.isObject(prototype) && Object.isFunction(prototype.constructor) ? ConstantExpression.nameOf(prototype.constructor) : ConstantExpression.OBJECT_NAME;
  }

  private static nameOf(value: Function): string {
    return String.isNullOrEmpty(value.name) ? ConstantExpression.ANONYMOUS_NAME : value.name;
  }
}
