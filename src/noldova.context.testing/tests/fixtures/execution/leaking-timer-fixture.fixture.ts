/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class LeakingTimerFixtureTests {
  private static readonly TIMERS: NodeJS.Timeout[] = [];

  @TestMethod
  public leavesATimerRunning(): void {
    LeakingTimerFixtureTests.TIMERS.push(setTimeout(() => undefined, 60_000));
  }

  public static release(): void {
    for (const timer of LeakingTimerFixtureTests.TIMERS.splice(0))
      clearTimeout(timer);
  }
}
