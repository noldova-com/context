/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception, ExceptionOptions, KeyNotFoundException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class KeyNotFoundExceptionTests {
  @TestMethod
  public defaultsTheMessage(): void {
    Assert.areEqual("The key is not present in the collection.", new KeyNotFoundException().message);
  }

  @TestMethod
  public preservesAnExplicitEmptyMessage(): void {
    Assert.areEqual("", new KeyNotFoundException("").message);
  }

  @TestMethod
  public acceptsACustomMessageAndCause(): void {
    const cause = new Error("cause");
    const failure = new KeyNotFoundException("Missing key.", new ExceptionOptions(cause));

    Assert.areEqual("Missing key.", failure.message);
    Assert.areEqual(cause, failure.cause);
  }

  @TestMethod
  public setsTheName(): void {
    Assert.areEqual("KeyNotFoundException", new KeyNotFoundException().name);
  }

  @TestMethod
  public isAnException(): void {
    Assert.isInstanceOf(new KeyNotFoundException(), Exception);
  }
}
