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

export class ParameterExpression extends Expression {
  public readonly name: string;

  public constructor(name: string) {
    super();
    ArgumentException.throwIfNullOrWhitespace(name, Resources.nameParameterName);
    this.name = name;
  }

  protected override get precedence(): ExpressionPrecedence {
    return ExpressionPrecedence.Primary;
  }

  protected override replaceChildren(): Expression {
    return this;
  }

  protected override write(): string {
    return this.name;
  }
}
