/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { CancellationTokenSource } from "@noldova/context.threading";

@TestClass
export class CancellationTokenRegistrationTests {
  @TestMethod
  public takesItsCallbackBackOnce(): void {
    const source = new CancellationTokenSource();
    let ran = false;
    const registration = source.token.register(() => {
      ran = true;
    });

    Assert.isTrue(registration.unregister());
    Assert.isFalse(registration.unregister());
    source.cancel();

    Assert.isFalse(ran);
  }

  @TestMethod
  public takesItsCallbackBackWhenDisposed(): void {
    const source = new CancellationTokenSource();
    let ran = false;
    {
      using _registration = source.token.register(() => {
        ran = true;
      });
    }
    source.cancel();

    Assert.isFalse(ran);
  }

  @TestMethod
  public cannotTakeBackACallbackThatRan(): void {
    const source = new CancellationTokenSource();
    const registration = source.token.register(() => undefined);
    source.cancel();

    Assert.isFalse(registration.unregister());
  }
}
