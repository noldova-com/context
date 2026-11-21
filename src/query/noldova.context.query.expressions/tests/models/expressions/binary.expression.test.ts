/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BinaryOperator, Expression, type ParameterExpression } from "@noldova/context.query.expressions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class BinaryExpressionTests {
  private static readonly CHAIN_LENGTH: number = 100_000;

  private readonly a: ParameterExpression = Expression.parameter("a");
  private readonly b: ParameterExpression = Expression.parameter("b");
  private readonly c: ParameterExpression = Expression.parameter("c");

  @TestMethod
  public writesEachOperatorWithItsToken(): void {
    const written = Object.values(BinaryOperator).map(t => Expression.binary(t, this.a, this.b).toString());

    Assert.areEqual("a + b|a - b|a * b|a / b|a === b|a !== b|a < b|a <= b|a > b|a >= b|a && b|a || b|a ?? b", written.join("|"));
  }

  @TestMethod
  public parenthesizesOnlyWherePrecedenceRequires(): void {
    const sum = Expression.binary(BinaryOperator.Add, this.a, this.b);
    const product = Expression.binary(BinaryOperator.Multiply, this.a, this.b);
    const difference = Expression.binary(BinaryOperator.Subtract, this.b, this.c);

    Assert.areEqual("(a + b) * c", Expression.binary(BinaryOperator.Multiply, sum, this.c).toString());
    Assert.areEqual("a * b + c", Expression.binary(BinaryOperator.Add, product, this.c).toString());
    Assert.areEqual("c + a * b", Expression.binary(BinaryOperator.Add, this.c, product).toString());
    Assert.areEqual("a - (b - c)", Expression.binary(BinaryOperator.Subtract, this.a, difference).toString());
    Assert.areEqual("b - c - a", Expression.binary(BinaryOperator.Subtract, difference, this.a).toString());
    Assert.areEqual("a + b > c", Expression.binary(BinaryOperator.GreaterThan, sum, this.c).toString());
    Assert.areEqual("a + b === c && c", Expression.binary(BinaryOperator.And, Expression.binary(BinaryOperator.Equal, sum, this.c), this.c).toString());
  }

  @TestMethod
  public parenthesizesAndOrOrInsideCoalesce(): void {
    const and = Expression.binary(BinaryOperator.And, this.a, this.b);
    const or = Expression.binary(BinaryOperator.Or, this.b, this.c);
    const coalesce = Expression.binary(BinaryOperator.Coalesce, this.a, this.b);
    const equal = Expression.binary(BinaryOperator.Equal, this.a, this.b);

    Assert.areEqual("(a && b) ?? c", Expression.binary(BinaryOperator.Coalesce, and, this.c).toString());
    Assert.areEqual("a ?? (b || c)", Expression.binary(BinaryOperator.Coalesce, this.a, or).toString());
    Assert.areEqual("(a ?? b) || c", Expression.binary(BinaryOperator.Or, coalesce, this.c).toString());
    Assert.areEqual("a ?? b ?? c", Expression.binary(BinaryOperator.Coalesce, coalesce, this.c).toString());
    Assert.areEqual("a === b ?? c", Expression.binary(BinaryOperator.Coalesce, equal, this.c).toString());
  }

  @TestMethod
  public replacesEitherOperandAndKeepsItselfWhenNothingMatches(): void {
    const sum = Expression.binary(BinaryOperator.Add, this.a, this.b);

    Assert.areEqual("c + b", sum.replace(this.a, this.c).toString());
    Assert.areEqual("a + c", sum.replace(this.b, this.c).toString());
    Assert.areEqual(sum, sum.replace(this.c, this.a));
  }

  @TestMethod
  public writesAndReplacesALeftDeepChainOfAnyLength(): void {
    this.assertChain(() => false);
  }

  @TestMethod
  public writesAndReplacesARightDeepChainOfAnyLength(): void {
    this.assertChain(() => true);
  }

  @TestMethod
  public writesAndReplacesAChainThatAlternatesSides(): void {
    this.assertChain(index => index % 2 === 0);
  }

  @TestMethod
  public replacesANodeInsideAChain(): void {
    const leftMiddle = Expression.binary(BinaryOperator.And, Expression.binary(BinaryOperator.And, this.a, this.b), this.c);
    const leftChain = Expression.binary(BinaryOperator.And, Expression.binary(BinaryOperator.And, leftMiddle, this.a), this.b);
    const rightMiddle = Expression.binary(BinaryOperator.Or, this.a, Expression.binary(BinaryOperator.Or, this.b, this.c));
    const rightChain = Expression.binary(BinaryOperator.Or, this.a, Expression.binary(BinaryOperator.Or, this.b, rightMiddle));

    Assert.areEqual("c && a && b", leftChain.replace(leftMiddle, this.c).toString());
    Assert.areEqual("a || (b || c)", rightChain.replace(rightMiddle, this.c).toString());
  }

  private assertChain(growsRight: (index: number) => boolean): void {
    let chain: Expression = Expression.binary(BinaryOperator.Subtract, this.a, this.a);
    let text = "a - a";
    for (let index = 1; index < BinaryExpressionTests.CHAIN_LENGTH; index++) {
      chain = growsRight(index) ? Expression.binary(BinaryOperator.Subtract, this.a, chain) : Expression.binary(BinaryOperator.Subtract, chain, this.a);
      text = growsRight(index) ? `a - (${text})` : `${text} - a`;
    }

    Assert.areEqual(text, chain.toString());
    Assert.areEqual(text.replaceAll("a", "b"), chain.replace(this.a, this.b).toString());
    Assert.areEqual(chain, chain.replace(this.c, this.b));
  }
}
