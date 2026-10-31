/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { CommandFailedException } from "@noldova/context.tooling";

@TestClass
export class CommandFailedExceptionTests {
  @TestMethod
  public isAnErrorCarryingTheMessageAndCause(): void {
    const cause = new Error("cause");
    const exception = new CommandFailedException("The version is not of the form 0.0.<n>.", { cause });

    Assert.isInstanceOf(exception, Error);
    Assert.areEqual("The version is not of the form 0.0.<n>.", exception.message);
    Assert.areEqual(cause, exception.cause);
  }
}
