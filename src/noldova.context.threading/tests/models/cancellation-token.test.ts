/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { CancellationToken, CancellationTokenSource, OperationCanceledException } from "@noldova/context.threading";

@TestClass
export class CancellationTokenTests {
  @TestMethod
  public neverCancelsNone(): void {
    let ran = false;
    const registration = CancellationToken.none.register(() => {
      ran = true;
    });

    Assert.isFalse(CancellationToken.none.canBeCanceled);
    Assert.isFalse(CancellationToken.none.isCancellationRequested);
    Assert.isFalse(registration.unregister());
    Assert.doesNotThrow(() => CancellationToken.none.throwIfCancellationRequested());
    Assert.isFalse(ran);
  }

  @TestMethod
  public followsItsSource(): void {
    const source = new CancellationTokenSource();

    Assert.isTrue(source.token.canBeCanceled);
    Assert.isFalse(source.token.isCancellationRequested);
    Assert.doesNotThrow(() => source.token.throwIfCancellationRequested());

    source.cancel();

    Assert.isTrue(source.token.isCancellationRequested);
  }

  @TestMethod
  public throwsWithItselfOnceCanceled(): void {
    const source = new CancellationTokenSource();
    source.cancel();

    const exception = Assert.throws(() => source.token.throwIfCancellationRequested(), OperationCanceledException);

    Assert.areEqual("The operation was canceled.", exception.message);
    Assert.areEqual(source.token, exception.cancellationToken);
  }
}
