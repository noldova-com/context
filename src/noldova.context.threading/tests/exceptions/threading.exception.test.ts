/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception, ExceptionOptions } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { ThreadingException } from "@noldova/context.threading";

@TestClass
export class ThreadingExceptionTests {
  @TestMethod
  public keepsTheMessageAndTheCause(): void {
    const cause = new Error("cause");
    const exception = new ThreadingException("failed", new ExceptionOptions(cause));

    Assert.isInstanceOf(exception, Exception);
    Assert.areEqual("ThreadingException", exception.name);
    Assert.areEqual("failed", exception.message);
    Assert.areEqual(cause, exception.cause);
  }
}
