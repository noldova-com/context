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
export class MemberExpressionExtensionsTests {
  @TestMethod
  public async readsFieldsGettersAndMembersOfPrimitivesAsync(): Promise<void> {
    const person = new Person("Ana", 34);

    Assert.areEqual(34, await Evaluation.evaluateAsync(Expression.member(Evaluation.x, "age"), person));
    Assert.areEqual("A", await Evaluation.evaluateAsync(Expression.member(Evaluation.x, "initial"), person));
    Assert.areEqual(3, await Evaluation.evaluateAsync(Expression.member(Evaluation.x, "length"), "Ana"));
    Assert.isUndefined(await Evaluation.evaluateAsync(Expression.member(Evaluation.x, "missing"), person));
  }

  @TestMethod
  public async rejectsAMemberOfNullOrUndefinedAsync(): Promise<void> {
    const read = Expression.member(Evaluation.x, "age");
    const exception = await Assert.throwsAsync(() => Evaluation.evaluateAsync(read, null), TypeError);
    await Assert.throwsAsync(() => Evaluation.evaluateAsync(read, undefined), TypeError);

    Assert.areEqual("A member cannot be read from null or undefined.", exception.message);
  }
}
