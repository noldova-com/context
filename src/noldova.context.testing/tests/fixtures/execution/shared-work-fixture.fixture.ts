/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class LeavesSharedWorkFixtureTests {
  public static settle: () => void = () => undefined;

  @TestMethod
  public leavesWorkOnASharedPromise(): void {
    const shared = new Promise<void>(resolve => {
      LeavesSharedWorkFixtureTests.settle = resolve;
    });
    void shared.then(() => {
      throw new Error("late");
    });
  }
}

@TestClass
export class SettlesSharedWorkFixtureTests {
  @TestMethod
  public settlesTheSharedPromise(): void {
    LeavesSharedWorkFixtureTests.settle();
  }
}
