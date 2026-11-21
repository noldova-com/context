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
import type { LambdaFunction } from "../../types/lambda-function.js";
import { Expression } from "./expression.js";
import { ParameterExpression } from "./parameter.expression.js";

export class LambdaExpression<TFunction extends LambdaFunction = LambdaFunction> extends Expression {
  private static readonly ARROW: string = " => ";
  private static readonly OBJECT_START: string = "{";

  public readonly parameters: readonly ParameterExpression[];
  public readonly body: Expression;

  public constructor(parameters: readonly ParameterExpression[], body: Expression) {
    super();
    Expression.throwIfNamesRepeated(parameters.map(t => t.name), Resources.parametersParameterName, Resources.parameterNamesRepeated);
    this.parameters = parameters;
    this.body = body;
  }

  protected override get precedence(): ExpressionPrecedence {
    return ExpressionPrecedence.Lambda;
  }

  protected override replaceChildren(target: Expression, replacement: Expression): Expression {
    const replaced = Expression.replaceEach(this.parameters, target, replacement);
    const body = this.body.replace(target, replacement);
    if (replaced === this.parameters && body === this.body)
      return this;

    const parameters = replaced.filter(t => t instanceof ParameterExpression);
    if (parameters.length !== replaced.length)
      throw new ArgumentException(Resources.parameterReplacementInvalid, Resources.replacementParameterName);

    Expression.throwIfNamesRepeated(parameters.map(t => t.name), Resources.replacementParameterName, Resources.parameterNamesRepeated);
    return new LambdaExpression<TFunction>(parameters, body);
  }

  protected override write(): string {
    const names = this.parameters.map(t => t.name).join(", ");
    const parameterText = this.parameters.length === 1 ? names : `(${names})`;
    const bodyText = Expression.writeOperand(this.body, ExpressionPrecedence.Lambda);
    return parameterText + LambdaExpression.ARROW + (bodyText.startsWith(LambdaExpression.OBJECT_START) ? `(${bodyText})` : bodyText);
  }
}
