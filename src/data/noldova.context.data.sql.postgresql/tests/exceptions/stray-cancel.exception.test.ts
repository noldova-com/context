/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { StrayCancelException } from "@noldova/context.data.sql.postgresql/exceptions/stray-cancel.exception.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class StrayCancelExceptionTests {
  @TestMethod
  public saysAnotherQuerysCancelStoppedTheStatementAndKeepsTheServerError(): void {
    const cause = new Error("canceling statement due to user request");
    const error = new StrayCancelException(cause);

    Assert.areEqual(
      "Another query's cancel request reached the server after that query had ended and canceled this statement, which could not be retried.", error.message);
    Assert.areEqual<unknown>(cause, error.cause);
    Assert.areEqual("StrayCancelException", error.name);
  }
}
