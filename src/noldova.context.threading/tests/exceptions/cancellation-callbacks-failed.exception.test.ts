/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { CancellationCallbacksFailedException, ThreadingException } from "@noldova/context.threading";

@TestClass
export class CancellationCallbacksFailedExceptionTests {
  @TestMethod
  public keepsEachError(): void {
    const errors = [new Error("first"), "second"];
    const exception = new CancellationCallbacksFailedException(errors);

    Assert.isInstanceOf(exception, ThreadingException);
    Assert.areEqual("A callback registered for the cancellation threw; each error is in errors.", exception.message);
    Assert.areEqual(errors, exception.errors);
  }
}
