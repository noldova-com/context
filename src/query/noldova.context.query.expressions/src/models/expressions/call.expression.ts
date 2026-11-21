/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";

import { ExpressionPrecedence } from "../../enums/expression-precedence.js";
import { Resources } from "../../resources.js";
import { Expression } from "./expression.js";

export class CallExpression extends Expression {
  public readonly target: Expression;
  public readonly name: string;
  public readonly arguments: readonly Expression[];

  public constructor(target: Expression, name: string, argumentExpressions: readonly Expression[]) {
    super();
    ArgumentException.throwIfNullOrWhitespace(name, Resources.nameParameterName);
    this.target = target;
    this.name = name;
    this.arguments = argumentExpressions;
  }

  protected override get precedence(): ExpressionPrecedence {
    return ExpressionPrecedence.Member;
  }

  protected override replaceChildren(target: Expression, replacement: Expression): Expression {
    const replacedTarget = this.target.replace(target, replacement);
    const argumentExpressions = Expression.replaceEach(this.arguments, target, replacement);
    return replacedTarget === this.target && argumentExpressions === this.arguments
      ? this
      : new CallExpression(replacedTarget, this.name, argumentExpressions);
  }

  protected override write(): string {
    const argumentTexts = this.arguments.map(t => Expression.writeOperand(t, ExpressionPrecedence.Lambda));
    return `${Expression.writeOperand(this.target, ExpressionPrecedence.Member)}${Expression.writeAccess(this.name)}(${argumentTexts.join(", ")})`;
  }
}
