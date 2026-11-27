/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CommandHostException } from "@noldova/context";
import { Exception, ExceptionOptions } from "@noldova/context.exceptions";
import { SDKException } from "@noldova/context.sdk";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class SDKExceptionTests {
  @TestMethod
  public isACommandHostExceptionWithItsMessageAndCause(): void {
    const cause = new Error("inner");
    const exception = new SDKException("The build failed.", new ExceptionOptions(cause));

    Assert.isInstanceOf(exception, CommandHostException);
    Assert.isInstanceOf(exception, Exception);
    Assert.areEqual("SDKException", exception.name);
    Assert.areEqual("The build failed.", exception.message);
    Assert.areEqual(cause, exception.cause);
  }
}
