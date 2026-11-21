/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ExpressionPrecedence } from "../../enums/expression-precedence.js";
import type { UnaryOperator } from "../../enums/unary-operator.js";
import { Expression } from "./expression.js";

export class UnaryExpression extends Expression {
  private static readonly NOT_TOKEN: string = "!";

  public readonly operator: UnaryOperator;
  public readonly operand: Expression;

  public constructor(operator: UnaryOperator, operand: Expression) {
    super();
    this.operator = operator;
    this.operand = operand;
  }

  protected override get precedence(): ExpressionPrecedence {
    return ExpressionPrecedence.Unary;
  }

  protected override replaceChildren(target: Expression, replacement: Expression): Expression {
    const replaced = this.operand.replace(target, replacement);
    return replaced === this.operand ? this : new UnaryExpression(this.operator, replaced);
  }

  protected override write(): string {
    return UnaryExpression.NOT_TOKEN + Expression.writeOperand(this.operand, ExpressionPrecedence.Unary);
  }
}
