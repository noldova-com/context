/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Expression, UnaryOperator } from "@noldova/context.query.expressions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { Evaluation } from "../../fixtures/evaluation.fixture.js";

@TestClass
export class UnaryExpressionExtensionsTests {
  private static readonly NESTING_DEPTH: number = 1_000;

  @TestMethod
  public async negatesItsOperandsTruthinessAsync(): Promise<void> {
    const not = Expression.unary(UnaryOperator.Not, Evaluation.x);

    Assert.areEqual(true, await Evaluation.evaluateAsync(not, 0));
    Assert.areEqual(false, await Evaluation.evaluateAsync(not, "a"));
  }

  @TestMethod
  public async evaluatesOperatorsNestedToTheSupportedDepthAsync(): Promise<void> {
    let nested: Expression = Evaluation.x;
    for (let index = 0; index < UnaryExpressionExtensionsTests.NESTING_DEPTH; index++)
      nested = Expression.unary(UnaryOperator.Not, nested);

    Assert.areEqual(false, await Evaluation.evaluateAsync(nested, 0));
    Assert.areEqual(true, await Evaluation.evaluateAsync(nested, "a"));
  }
}
