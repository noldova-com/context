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
export class ConditionalExpressionTests {
  private readonly a: ParameterExpression = Expression.parameter("a");
  private readonly b: ParameterExpression = Expression.parameter("b");
  private readonly c: ParameterExpression = Expression.parameter("c");

  @TestMethod
  public writesTheTestAndBothResults(): void {
    const isAdult = Expression.binary(BinaryOperator.GreaterThanOrEqual, Expression.member(this.a, "age"), Expression.constant(18));

    Assert.areEqual("a.age >= 18 ? \"adult\" : \"minor\"",
      Expression.conditional(isAdult, Expression.constant("adult"), Expression.constant("minor")).toString());
  }

  @TestMethod
  public parenthesizesAConditionalTestButNotAConditionalResult(): void {
    const inner = Expression.conditional(this.a, this.b, this.c);

    Assert.areEqual("(a ? b : c) ? b : c", Expression.conditional(inner, this.b, this.c).toString());
    Assert.areEqual("a ? a ? b : c : a ? b : c", Expression.conditional(this.a, inner, inner).toString());
    Assert.areEqual("a ?? b ? b : c", Expression.conditional(Expression.binary(BinaryOperator.Coalesce, this.a, this.b), this.b, this.c).toString());
  }

  @TestMethod
  public replacesEachPartAndKeepsItselfWhenNothingMatches(): void {
    const choice = Expression.conditional(this.a, this.b, this.c);
    const d = Expression.parameter("d");

    Assert.areEqual("d ? b : c", choice.replace(this.a, d).toString());
    Assert.areEqual("a ? d : c", choice.replace(this.b, d).toString());
    Assert.areEqual("a ? b : d", choice.replace(this.c, d).toString());
    Assert.areEqual(choice, choice.replace(d, this.a));
  }
}
