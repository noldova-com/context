/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { InvalidOperationException } from "@noldova/context.exceptions";
import { Expression } from "@noldova/context.query.expressions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { Evaluation } from "../../fixtures/evaluation.fixture.js";

@TestClass
export class ExpressionExtensionsTests {
  @TestMethod
  public async rejectsAPropertyOutsideItsObjectAsync(): Promise<void> {
    const exception = await Assert.throwsAsync(() => Evaluation.evaluateAsync(Expression.property("a", Expression.constant(1))), InvalidOperationException);

    Assert.areEqual("This expression can only be evaluated as part of its parent.", exception.message);
  }
}
