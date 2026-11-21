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
export class ObjectExpressionExtensionsTests {
  @TestMethod
  public async createsAnObjectWithItsPropertiesInOrderAsync(): Promise<void> {
    const object = Expression.object([
      Expression.property("name", Expression.member(Evaluation.x, "name")),
      Expression.property("__proto__", Expression.member(Evaluation.x, "age"))
    ]);

    const value = await Evaluation.evaluateAsync(object, new Person("Ana", 34));

    Assert.areEqual("{\"name\":\"Ana\",\"__proto__\":34}", JSON.stringify(value));
    Assert.areEqual(Object.prototype, Object.getPrototypeOf(value));
  }
}
