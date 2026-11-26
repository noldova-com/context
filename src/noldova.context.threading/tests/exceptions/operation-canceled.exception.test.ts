/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ExceptionOptions } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { CancellationToken, CancellationTokenSource, OperationCanceledException, ThreadingException } from "@noldova/context.threading";

@TestClass
export class OperationCanceledExceptionTests {
  @TestMethod
  public saysTheOperationWasCanceledWithNoTokenByDefault(): void {
    const exception = new OperationCanceledException();

    Assert.isInstanceOf(exception, ThreadingException);
    Assert.areEqual("OperationCanceledException", exception.name);
    Assert.areEqual("The operation was canceled.", exception.message);
    Assert.areEqual(CancellationToken.none, exception.cancellationToken);
  }

  @TestMethod
  public keepsAMessageATokenAndACause(): void {
    const source = new CancellationTokenSource();
    const cause = new Error("cause");
    const exception = new OperationCanceledException("stopped", source.token, new ExceptionOptions(cause));

    Assert.areEqual("stopped", exception.message);
    Assert.areEqual(source.token, exception.cancellationToken);
    Assert.areEqual(cause, exception.cause);
  }
}
