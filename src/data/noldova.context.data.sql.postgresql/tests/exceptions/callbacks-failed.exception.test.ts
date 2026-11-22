/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";
import { CallbacksFailedException } from "@noldova/context.data.sql.postgresql/exceptions/callbacks-failed.exception.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class CallbacksFailedExceptionTests {
  @TestMethod
  public saysSeveralCallbacksThrewAndKeepsTheirErrorsInOrder(): void {
    const first = new Error("first");
    const second = new Error("second");
    const error = new CallbacksFailedException([first, second]);

    Assert.areEqual("More than one of the client's callbacks threw; errors holds each error, in order.", error.message);
    Assert.areEqual(2, error.errors.length);
    Assert.isTrue(error.errors[0] === first);
    Assert.isTrue(error.errors[1] === second);
    Assert.isInstanceOf(error, DataException);
    Assert.areEqual("CallbacksFailedException", error.name);
  }
}
