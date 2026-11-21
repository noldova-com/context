/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BinaryOperator, Expression, UnaryOperator } from "@noldova/context.query.expressions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class UnaryExpressionTests {
  @TestMethod
  public writesNotBeforeItsOperand(): void {
    const person = Expression.parameter("person");
    const isActive = Expression.member(person, "isActive");

    Assert.areEqual("!person.isActive", Expression.unary(UnaryOperator.Not, isActive).toString());
    Assert.areEqual("!!person.isActive", Expression.unary(UnaryOperator.Not, Expression.unary(UnaryOperator.Not, isActive)).toString());
  }

  @TestMethod
  public parenthesizesAnOperandOfLowerPrecedence(): void {
    const a = Expression.parameter("a");
    const b = Expression.parameter("b");

    Assert.areEqual("!(a && b)", Expression.unary(UnaryOperator.Not, Expression.binary(BinaryOperator.And, a, b)).toString());
  }

  @TestMethod
  public replacesItsOperandAndKeepsItselfWhenNothingMatches(): void {
    const a = Expression.parameter("a");
    const b = Expression.parameter("b");
    const not = Expression.unary(UnaryOperator.Not, a);

    Assert.areEqual("!b", not.replace(a, b).toString());
    Assert.areEqual(not, not.replace(b, a));
  }

  @TestMethod
  public writesAndReplacesNestingAThousandLevelsDeep(): void {
    const a = Expression.parameter("a");
    const b = Expression.parameter("b");
    let nested: Expression = a;
    for (let level = 0; level < 1_000; level++)
      nested = Expression.unary(UnaryOperator.Not, nested);

    Assert.areEqual(`${"!".repeat(1_000)}a`, nested.toString());
    Assert.areEqual(`${"!".repeat(1_000)}b`, nested.replace(a, b).toString());
  }
}
