/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ExpressionPrecedence } from "../../enums/expression-precedence.js";
import { Expression } from "./expression.js";

export class ConditionalExpression extends Expression {
  public readonly test: Expression;
  public readonly whenTrue: Expression;
  public readonly whenFalse: Expression;

  public constructor(test: Expression, whenTrue: Expression, whenFalse: Expression) {
    super();
    this.test = test;
    this.whenTrue = whenTrue;
    this.whenFalse = whenFalse;
  }

  protected override get precedence(): ExpressionPrecedence {
    return ExpressionPrecedence.Conditional;
  }

  protected override replaceChildren(target: Expression, replacement: Expression): Expression {
    const test = this.test.replace(target, replacement);
    const whenTrue = this.whenTrue.replace(target, replacement);
    const whenFalse = this.whenFalse.replace(target, replacement);
    return test === this.test && whenTrue === this.whenTrue && whenFalse === this.whenFalse
      ? this
      : new ConditionalExpression(test, whenTrue, whenFalse);
  }

  protected override write(): string {
    return `${Expression.writeOperand(this.test, ExpressionPrecedence.NullishCoalescing)} ? ${Expression.writeOperand(this.whenTrue, ExpressionPrecedence.Lambda)} : `
      + Expression.writeOperand(this.whenFalse, ExpressionPrecedence.Lambda);
  }
}
