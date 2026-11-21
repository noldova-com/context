/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Enumerable } from "@noldova/context.collections";
import { InvalidOperationException } from "@noldova/context.exceptions";
import { BinaryOperator, Expression } from "@noldova/context.query.expressions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { Evaluation } from "../../fixtures/evaluation.fixture.js";

@TestClass
export class LambdaExpressionExtensionsTests {
  @TestMethod
  public async readsTheParametersOfEveryEnclosingLambdaAsync(): Promise<void> {
    const n = Expression.parameter("n");
    const m = Expression.parameter("m");
    const numbers = Expression.constant(Enumerable.from([10, 20, 30]));
    const above = Expression.call(numbers, "count", [Expression.lambda([n], Expression.binary(BinaryOperator.GreaterThan, n, Evaluation.x))]);
    const pairs = Expression.call(numbers, "count", [Expression.lambda([n],
      Expression.call(numbers, "any", [Expression.lambda([m], Expression.binary(BinaryOperator.Equal, Expression.binary(BinaryOperator.Add, m, n), Evaluation.x))]))]);

    Assert.areEqual(2, await Evaluation.evaluateAsync(above, 15));
    Assert.areEqual(2, await Evaluation.evaluateAsync(pairs, 50));
  }

  @TestMethod
  public async passesEachArgumentToItsParameterAsync(): Promise<void> {
    const item = Expression.parameter("item");
    const index = Expression.parameter("index");
    const indexed = Expression.call(Expression.constant(Enumerable.from(["a", "b"])), "select", [Expression.lambda([item, index], Expression.binary(BinaryOperator.Add, item, index))]);

    const joined = Expression.call(Expression.call(indexed, "toArray", []), "join", [Expression.constant(",")]);

    Assert.areEqual("a0,b1", await Evaluation.evaluateAsync(joined));
  }

  @TestMethod
  public async rejectsAParameterOutsideItsLambdaAsync(): Promise<void> {
    const exception = await Assert.throwsAsync(() => Evaluation.evaluateAsync(Expression.parameter("y")), InvalidOperationException);

    Assert.areEqual("A parameter can only be used inside the lambda that declares it.", exception.message);
  }
}
