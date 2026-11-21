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

export class PropertyExpression extends Expression {
  public readonly name: string;
  public readonly value: Expression;

  public constructor(name: string, value: Expression) {
    super();
    ArgumentException.throwIfNullOrWhitespace(name, Resources.nameParameterName);
    this.name = name;
    this.value = value;
  }

  protected override get precedence(): ExpressionPrecedence {
    return ExpressionPrecedence.Primary;
  }

  protected override replaceChildren(target: Expression, replacement: Expression): Expression {
    const value = this.value.replace(target, replacement);
    return value === this.value ? this : new PropertyExpression(this.name, value);
  }

  protected override write(): string {
    return `${Expression.writeKey(this.name)}: ${Expression.writeOperand(this.value, ExpressionPrecedence.Lambda)}`;
  }
}
