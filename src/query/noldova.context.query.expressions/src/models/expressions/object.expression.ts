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
import { PropertyExpression } from "./property.expression.js";

export class ObjectExpression extends Expression {
  private static readonly EMPTY_TEXT: string = "{}";

  public readonly properties: readonly PropertyExpression[];

  public constructor(properties: readonly PropertyExpression[]) {
    super();
    Expression.throwIfNamesRepeated(properties.map(t => t.name), Resources.propertiesParameterName, Resources.propertyNamesRepeated);
    this.properties = properties;
  }

  protected override get precedence(): ExpressionPrecedence {
    return ExpressionPrecedence.Primary;
  }

  protected override replaceChildren(target: Expression, replacement: Expression): Expression {
    const replaced = Expression.replaceEach(this.properties, target, replacement);
    if (replaced === this.properties)
      return this;

    const properties = replaced.filter(t => t instanceof PropertyExpression);
    if (properties.length !== replaced.length)
      throw new ArgumentException(Resources.propertyReplacementInvalid, Resources.replacementParameterName);

    Expression.throwIfNamesRepeated(properties.map(t => t.name), Resources.replacementParameterName, Resources.propertyNamesRepeated);
    return new ObjectExpression(properties);
  }

  protected override write(): string {
    return this.properties.length === 0
      ? ObjectExpression.EMPTY_TEXT
      : `{ ${this.properties.map(t => Expression.writeOperand(t, ExpressionPrecedence.Lambda)).join(", ")} }`;
  }
}
