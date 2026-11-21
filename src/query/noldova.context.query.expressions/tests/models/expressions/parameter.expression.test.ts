/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";
import { Expression } from "@noldova/context.query.expressions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ParameterExpressionTests {
  @TestMethod
  public rejectsABlankName(): void {
    Assert.areEqual("name", Assert.throws(() => Expression.parameter(""), ArgumentException).parameterName);
    Assert.areEqual("name", Assert.throws(() => Expression.parameter(" \n"), ArgumentException).parameterName);
  }

  @TestMethod
  public writesItsName(): void {
    Assert.areEqual("person", Expression.parameter("person").toString());
  }

  @TestMethod
  public isBoundByIdentityNotByName(): void {
    const first = Expression.parameter("person");
    const second = Expression.parameter("person");
    const replacement = Expression.constant(1);

    Assert.areEqual(second, second.replace(first, replacement));
    Assert.areEqual(replacement, first.replace(first, replacement));
  }
}
