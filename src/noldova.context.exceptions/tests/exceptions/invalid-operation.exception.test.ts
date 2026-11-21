/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception, ExceptionOptions, InvalidOperationException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class InvalidOperationExceptionTests {
  @TestMethod
  public defaultsTheMessage(): void {
    Assert.areEqual("The operation is not valid in the object's current state.", new InvalidOperationException().message);
  }

  @TestMethod
  public preservesAnExplicitEmptyMessage(): void {
    Assert.areEqual("", new InvalidOperationException("").message);
  }

  @TestMethod
  public acceptsACustomMessageAndCause(): void {
    const cause = new Error("cause");
    const failure = new InvalidOperationException("Invalid operation.", new ExceptionOptions(cause));

    Assert.areEqual("Invalid operation.", failure.message);
    Assert.areEqual(cause, failure.cause);
  }

  @TestMethod
  public setsTheName(): void {
    Assert.areEqual("InvalidOperationException", new InvalidOperationException().name);
  }

  @TestMethod
  public isAnException(): void {
    Assert.isInstanceOf(new InvalidOperationException(), Exception);
  }
}
