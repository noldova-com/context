/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception, ExceptionOptions } from "@noldova/context.exceptions";
import { ProcessesException } from "@noldova/context.processes";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ProcessesExceptionTests {
  @TestMethod
  public keepsTheMessageAndTheCause(): void {
    const cause = new Error("cause");

    const exception = new ProcessesException("The lister failed.", new ExceptionOptions(cause));

    Assert.isInstanceOf(exception, Exception);
    Assert.areEqual("ProcessesException", exception.name);
    Assert.areEqual("The lister failed.", exception.message);
    Assert.areEqual(cause, exception.cause);
  }
}
