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
import { Person } from "../../fixtures/person.fixture.js";

@TestClass
export class CallExpressionExtensionsTests {
  private readonly failing: Expression = Expression.member(Expression.constant(null), "missing");

  @TestMethod
  public async callsAMethodOnItsTargetAsync(): Promise<void> {
    Assert.areEqual("Hello Ana", await Evaluation.evaluateAsync(Expression.call(Evaluation.x, "describe", [Expression.constant("Hello")]), new Person("Ana", 34)));
    Assert.areEqual("ANA", await Evaluation.evaluateAsync(Expression.call(Evaluation.x, "toUpperCase", []), "Ana"));
  }

  @TestMethod
  public async rejectsACallToAMemberThatIsNotAFunctionAsync(): Promise<void> {
    const exception = await Assert.throwsAsync(() => Evaluation.evaluateAsync(Expression.call(Evaluation.x, "age", []), new Person("Ana", 34)), TypeError);
    await Assert.throwsAsync(() => Evaluation.evaluateAsync(Expression.call(Evaluation.x, "describe", []), null), TypeError);

    Assert.areEqual("The call's target has no method of that name.", exception.message);
  }

  @TestMethod
  public async evaluatesTheArgumentsBeforeCheckingTheMethodAsync(): Promise<void> {
    const exception = await Assert.throwsAsync(() => Evaluation.evaluateAsync(Expression.call(Evaluation.x, "age", [this.failing]), new Person("Ana", 34)), TypeError);

    Assert.areEqual("A member cannot be read from null or undefined.", exception.message);
  }
}
