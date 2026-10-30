/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception, ExceptionOptions } from "@noldova/context.exceptions";
import { ParserException } from "@noldova/context.parsers";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ParserExceptionTests {
  @TestMethod
  public carriesTheFailure(): void {
    const cause = new Error("cause");
    const failure = new ParserException("failure", new ExceptionOptions(cause));

    Assert.areEqual("failure", failure.message);
    Assert.areEqual("ParserException", failure.name);
    Assert.areEqual(cause, failure.cause);
    Assert.isInstanceOf(failure, Exception);
  }
}
