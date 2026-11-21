/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Expression } from "@noldova/context.query.expressions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { Point } from "../../fixtures/point.fixture.js";

@TestClass
export class ConstantExpressionTests {
  @TestMethod
  public writesPrimitivesAsLiterals(): void {
    Assert.areEqual("\"Ada \\\"A\\\"\"", Expression.constant("Ada \"A\"").toString());
    Assert.areEqual("-10n", Expression.constant(-10n).toString());
    Assert.areEqual("1.5", Expression.constant(1.5).toString());
    Assert.areEqual("-0", Expression.constant(-0).toString());
    Assert.areEqual("0", Expression.constant(0).toString());
    Assert.areEqual("NaN", Expression.constant(Number.NaN).toString());
    Assert.areEqual("true", Expression.constant(true).toString());
    Assert.areEqual("null", Expression.constant(null).toString());
    Assert.areEqual("undefined", Expression.constant(undefined).toString());
    Assert.areEqual("Symbol(key)", Expression.constant(Symbol("key")).toString());
  }

  @TestMethod
  public writesAFunctionByItsName(): void {
    const unnamed = ConstantExpressionTests.createUnnamedFunction();

    Assert.areEqual("Point", Expression.constant(Point).toString());
    Assert.areEqual("", unnamed.name);
    Assert.areEqual("anonymous", Expression.constant(unnamed).toString());
  }

  @TestMethod
  public writesAnyOtherObjectByItsClassName(): void {
    Assert.areEqual("[Point]", Expression.constant(new Point(1, 2)).toString());
    Assert.areEqual("[Array]", Expression.constant([1]).toString());
    Assert.areEqual("[Object]", Expression.constant(Object.create(null)).toString());
    Assert.areEqual("[Object]", Expression.constant(Object.create(Object.create(null))).toString());
    Assert.areEqual("[anonymous]", Expression.constant(new (ConstantExpressionTests.createUnnamedClass())()).toString());
  }

  @TestMethod
  public parenthesizesANumberWhoseMemberIsRead(): void {
    Assert.areEqual("(1).toFixed", Expression.member(Expression.constant(1), "toFixed").toString());
    Assert.areEqual("(2n).toString()", Expression.call(Expression.constant(2n), "toString", []).toString());
    Assert.areEqual("\"a\".length", Expression.member(Expression.constant("a"), "length").toString());
  }

  @TestMethod
  public retainsItsValueAndIsKeptByAReplacementThatDoesNotMatchIt(): void {
    const point = new Point(1, 2);
    const constant = Expression.constant(point);

    Assert.areEqual(point, constant.value);
    Assert.areEqual(constant, constant.replace(Expression.constant(point), Expression.constant(3)));
  }

  private static createUnnamedFunction(): () => void {
    return (): void => undefined;
  }

  private static createUnnamedClass(): new () => object {
    return class {
    };
  }
}
