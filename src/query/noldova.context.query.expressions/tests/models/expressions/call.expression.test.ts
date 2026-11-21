/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";
import { BinaryOperator, Expression, UnaryOperator } from "@noldova/context.query.expressions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class CallExpressionTests {
  @TestMethod
  public rejectsABlankName(): void {
    Assert.areEqual("name", Assert.throws(() => Expression.call(Expression.parameter("person"), "", []), ArgumentException).parameterName);
  }

  @TestMethod
  public writesTheTargetTheMethodAndTheArguments(): void {
    const person = Expression.parameter("person");
    const name = Expression.member(person, "name");
    const item = Expression.parameter("item");
    const isActive = Expression.lambda([item], Expression.member(item, "isActive"));

    Assert.areEqual("person.name.trim()", Expression.call(name, "trim", []).toString());
    Assert.areEqual("person.name.slice(1, 2)", Expression.call(name, "slice", [Expression.constant(1), Expression.constant(2)]).toString());
    Assert.areEqual("person.orders.some(item => item.isActive)", Expression.call(Expression.member(person, "orders"), "some", [isActive]).toString());
    Assert.areEqual("person[\"do-it\"]()", Expression.call(person, "do-it", []).toString());
    Assert.areEqual("person.name.trim().length", Expression.member(Expression.call(name, "trim", []), "length").toString());
    Assert.areEqual("!person.isActive()", Expression.unary(UnaryOperator.Not, Expression.call(person, "isActive", [])).toString());
    Assert.areEqual("(person.age + 1).toFixed()",
      Expression.call(Expression.binary(BinaryOperator.Add, Expression.member(person, "age"), Expression.constant(1)), "toFixed", []).toString());
  }

  @TestMethod
  public replacesItsTargetAndArgumentsAndKeepsItselfWhenNothingMatches(): void {
    const a = Expression.parameter("a");
    const b = Expression.parameter("b");
    const c = Expression.parameter("c");
    const call = Expression.call(a, "concat", [b, a]);

    Assert.areEqual("c.concat(b, c)", call.replace(a, c).toString());
    Assert.areEqual("a.concat(c, a)", call.replace(b, c).toString());
    Assert.areEqual(call, call.replace(c, a));
  }
}
