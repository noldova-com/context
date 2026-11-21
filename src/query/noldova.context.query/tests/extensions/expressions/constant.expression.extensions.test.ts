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
export class ConstantExpressionExtensionsTests {
  @TestMethod
  public async evaluatesToItsValueAsync(): Promise<void> {
    const value = new Date(2026, 0, 1);

    Assert.areEqual(5n, await Evaluation.evaluateAsync(Expression.constant(5n)));
    Assert.areEqual(value, await Evaluation.evaluateAsync(Expression.constant(value)));
  }
}
