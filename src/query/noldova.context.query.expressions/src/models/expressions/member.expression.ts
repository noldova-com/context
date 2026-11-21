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

export class MemberExpression extends Expression {
  public readonly target: Expression;
  public readonly name: string;

  public constructor(target: Expression, name: string) {
    super();
    ArgumentException.throwIfNullOrWhitespace(name, Resources.nameParameterName);
    this.target = target;
    this.name = name;
  }

  protected override get precedence(): ExpressionPrecedence {
    return ExpressionPrecedence.Member;
  }

  protected override replaceChildren(target: Expression, replacement: Expression): Expression {
    const replaced = this.target.replace(target, replacement);
    return replaced === this.target ? this : new MemberExpression(replaced, this.name);
  }

  protected override write(): string {
    return Expression.writeOperand(this.target, ExpressionPrecedence.Member) + Expression.writeAccess(this.name);
  }
}
