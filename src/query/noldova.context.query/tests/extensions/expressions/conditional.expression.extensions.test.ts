/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Expression } from "@noldova/context.query.expressions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { Evaluation } from "../../fixtures/evaluation.fixture.js";

@TestClass
export class ConditionalExpressionExtensionsTests {
  private static readonly NESTING_DEPTH: number = 1_000;

  @TestMethod
  public async evaluatesOnlyTheResultItsTestChoosesAsync(): Promise<void> {
    const failing = Expression.member(Expression.constant(null), "missing");

    Assert.areEqual("yes", await Evaluation.evaluateAsync(Expression.conditional(Evaluation.x, Expression.constant("yes"), failing), 1));
    Assert.areEqual("no", await Evaluation.evaluateAsync(Expression.conditional(Evaluation.x, failing, Expression.constant("no")), ""));
  }

  @TestMethod
  public async evaluatesConditionalsNestedToTheSupportedDepthAsync(): Promise<void> {
    let nested: Expression = Evaluation.x;
    for (let index = 0; index < ConditionalExpressionExtensionsTests.NESTING_DEPTH; index++)
      nested = Expression.conditional(Evaluation.x, nested, Expression.constant("no"));

    Assert.areEqual(5, await Evaluation.evaluateAsync(nested, 5));
    Assert.areEqual("no", await Evaluation.evaluateAsync(nested, 0));
  }
}
