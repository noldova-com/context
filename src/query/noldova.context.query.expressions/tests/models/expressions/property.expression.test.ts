/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";
import { BinaryOperator, Expression } from "@noldova/context.query.expressions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class PropertyExpressionTests {
  @TestMethod
  public rejectsABlankName(): void {
    Assert.areEqual("name", Assert.throws(() => Expression.property("\t", Expression.constant(1)), ArgumentException).parameterName);
  }

  @TestMethod
  public writesItsNameAndValue(): void {
    const a = Expression.parameter("a");
    const b = Expression.parameter("b");

    Assert.areEqual("name: a", Expression.property("name", a).toString());
    Assert.areEqual("\"first-name\": a", Expression.property("first-name", a).toString());
    Assert.areEqual("both: a || b", Expression.property("both", Expression.binary(BinaryOperator.Or, a, b)).toString());
  }

  @TestMethod
  public replacesItsValueAndKeepsItselfWhenNothingMatches(): void {
    const a = Expression.parameter("a");
    const b = Expression.parameter("b");
    const property = Expression.property("name", a);

    Assert.areEqual("name: b", property.replace(a, b).toString());
    Assert.areEqual(property, property.replace(b, a));
  }
}
