/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";

import type { ExpressionPrecedence } from "../../enums/expression-precedence.js";

export abstract class Expression {
  private static readonly IDENTIFIER_PATTERN: RegExp = /^[\p{ID_Start}$_][\p{ID_Continue}$\p{Join_Control}]*$/u;

  protected constructor() {
  }

  protected abstract get precedence(): ExpressionPrecedence;

  public replace(target: Expression, replacement: Expression): Expression {
    return this === target ? replacement : this.replaceChildren(target, replacement);
  }

  public toString(): string {
    return this.write();
  }

  protected static throwIfNamesRepeated(names: readonly string[], parameterName: string, message: string): void {
    if (new Set(names).size !== names.length)
      throw new ArgumentException(message, parameterName);
  }

  protected static replaceEach(expressions: readonly Expression[], target: Expression, replacement: Expression): readonly Expression[] {
    const replaced = expressions.map(t => t.replace(target, replacement));
    return replaced.some((t, index) => t !== expressions[index]) ? replaced : expressions;
  }

  protected static writeOperand(operand: Expression, minimum: ExpressionPrecedence): string {
    return Expression.enclose(operand, operand.write(), minimum);
  }

  protected static enclose(operand: Expression, text: string, minimum: ExpressionPrecedence): string {
    return operand.precedence < minimum ? `(${text})` : text;
  }

  protected static writeAccess(name: string): string {
    return Expression.IDENTIFIER_PATTERN.test(name) ? `.${name}` : `[${JSON.stringify(name)}]`;
  }

  protected static writeKey(name: string): string {
    return Expression.IDENTIFIER_PATTERN.test(name) ? name : JSON.stringify(name);
  }

  protected abstract replaceChildren(target: Expression, replacement: Expression): Expression;

  protected abstract write(): string;
}
