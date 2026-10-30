/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ExceptionOptions } from "@noldova/context.exceptions";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class ExceptionOptionsTests {
  @TestMethod
  public hasNoCauseWhenNoneIsGiven(): void {
    Assert.isUndefined(new ExceptionOptions().cause);
  }

  @TestMethod
  public preservesTheCause(): void {
    const cause = new Error("cause");

    Assert.areEqual<unknown>(cause, new ExceptionOptions(cause).cause);
  }

  @TestMethod
  @TestData(0)
  @TestData(false)
  @TestData(null)
  @TestData("")
  @TestData(undefined)
  public preservesFalsyCauses(cause: unknown): void {
    Assert.areEqual(cause, new ExceptionOptions(cause).cause);
  }
}
