/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BinaryOperator } from "../../enums/binary-operator.js";
import { ExpressionPrecedence } from "../../enums/expression-precedence.js";
import { BinaryOperatorSyntax } from "../binary-operator-syntax.js";
import { Expression } from "./expression.js";

export class BinaryExpression extends Expression {
  private static readonly SYNTAX: Readonly<Record<BinaryOperator, BinaryOperatorSyntax>> = {
    [BinaryOperator.Add]: new BinaryOperatorSyntax("+", ExpressionPrecedence.Additive),
    [BinaryOperator.Subtract]: new BinaryOperatorSyntax("-", ExpressionPrecedence.Additive),
    [BinaryOperator.Multiply]: new BinaryOperatorSyntax("*", ExpressionPrecedence.Multiplicative),
    [BinaryOperator.Divide]: new BinaryOperatorSyntax("/", ExpressionPrecedence.Multiplicative),
    [BinaryOperator.Equal]: new BinaryOperatorSyntax("===", ExpressionPrecedence.Equality),
    [BinaryOperator.NotEqual]: new BinaryOperatorSyntax("!==", ExpressionPrecedence.Equality),
    [BinaryOperator.LessThan]: new BinaryOperatorSyntax("<", ExpressionPrecedence.Relational),
    [BinaryOperator.LessThanOrEqual]: new BinaryOperatorSyntax("<=", ExpressionPrecedence.Relational),
    [BinaryOperator.GreaterThan]: new BinaryOperatorSyntax(">", ExpressionPrecedence.Relational),
    [BinaryOperator.GreaterThanOrEqual]: new BinaryOperatorSyntax(">=", ExpressionPrecedence.Relational),
    [BinaryOperator.And]: new BinaryOperatorSyntax("&&", ExpressionPrecedence.LogicalAnd),
    [BinaryOperator.Or]: new BinaryOperatorSyntax("||", ExpressionPrecedence.LogicalOr),
    [BinaryOperator.Coalesce]: new BinaryOperatorSyntax("??", ExpressionPrecedence.NullishCoalescing)
  };

  public readonly operator: BinaryOperator;
  public readonly left: Expression;
  public readonly right: Expression;
  private readonly syntax: BinaryOperatorSyntax;
  private readonly size: number;

  public constructor(operator: BinaryOperator, left: Expression, right: Expression) {
    super();
    this.operator = operator;
    this.left = left;
    this.right = right;
    this.syntax = BinaryExpression.SYNTAX[operator];
    this.size = 1 + BinaryExpression.sizeOf(left) + BinaryExpression.sizeOf(right);
  }

  protected override get precedence(): ExpressionPrecedence {
    return this.syntax.precedence;
  }

  private get heavier(): Expression {
    return BinaryExpression.sizeOf(this.right) > BinaryExpression.sizeOf(this.left) ? this.right : this.left;
  }

  protected override replaceChildren(target: Expression, replacement: Expression): Expression {
    let below: BinaryExpression | undefined;
    let rebuilt: Expression = this;
    for (const node of this.spine(target).reverse()) {
      rebuilt = node.rebuild(target, replacement, below, rebuilt);
      below = node;
    }

    return rebuilt;
  }

  protected override write(): string {
    let below: BinaryExpression | undefined;
    let text = "";
    for (const node of this.spine().reverse()) {
      text = node.writeWith(below, text);
      below = node;
    }

    return text;
  }

  private static sizeOf(expression: Expression): number {
    return expression instanceof BinaryExpression ? expression.size : 0;
  }

  private spine(target?: Expression): BinaryExpression[] {
    const spine: BinaryExpression[] = [this];
    let node = this.heavier;
    while (node instanceof BinaryExpression && node !== target) {
      spine.push(node);
      node = node.heavier;
    }

    return spine;
  }

  private rebuild(target: Expression, replacement: Expression, below: BinaryExpression | undefined, belowRebuilt: Expression): Expression {
    const left = this.left === below ? belowRebuilt : this.left.replace(target, replacement);
    const right = this.right === below ? belowRebuilt : this.right.replace(target, replacement);
    return left === this.left && right === this.right ? this : new BinaryExpression(this.operator, left, right);
  }

  private writeWith(below: BinaryExpression | undefined, belowText: string): string {
    const precedence = this.syntax.precedence;
    return `${this.writeSide(this.left, precedence, below, belowText)} ${this.syntax.token} ${this.writeSide(this.right, precedence + 1, below, belowText)}`;
  }

  private writeSide(operand: Expression, minimum: ExpressionPrecedence, below: BinaryExpression | undefined, belowText: string): string {
    const sideMinimum = this.mixesWithCoalesce(operand) ? ExpressionPrecedence.Primary : minimum;
    return operand === below ? Expression.enclose(operand, belowText, sideMinimum) : Expression.writeOperand(operand, sideMinimum);
  }

  private mixesWithCoalesce(operand: Expression): boolean {
    return this.operator === BinaryOperator.Coalesce && operand instanceof BinaryExpression
      && (operand.operator === BinaryOperator.And || operand.operator === BinaryOperator.Or);
  }
}
