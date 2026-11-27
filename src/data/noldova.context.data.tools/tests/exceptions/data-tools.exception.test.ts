/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CommandHostException } from "@noldova/context";
import { DataToolsException } from "@noldova/context.data.tools";
import { Exception, ExceptionOptions } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class DataToolsExceptionTests {
  @TestMethod
  public isACommandHostExceptionWithItsMessageAndCause(): void {
    const cause = new Error("inner");
    const exception = new DataToolsException("The tool failed.", new ExceptionOptions(cause));

    Assert.isInstanceOf(exception, CommandHostException);
    Assert.isInstanceOf(exception, Exception);
    Assert.areEqual("DataToolsException", exception.name);
    Assert.areEqual("The tool failed.", exception.message);
    Assert.areEqual(cause, exception.cause);
  }
}
