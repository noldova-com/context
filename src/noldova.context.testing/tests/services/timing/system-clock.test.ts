/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { SystemClock } from "@noldova/context.testing/services/timing/system-clock.js";

@TestClass
export class SystemClockTests {
  @TestMethod
  public readsATimeThatNeverMovesBackwards(): void {
    const clock = new SystemClock();
    const first = clock.now();

    Assert.isTrue(clock.now() >= first);
  }

  @TestMethod
  public readsTheSystemsCurrentTime(): void {
    const clock = new SystemClock();
    const before = performance.now();
    const now = clock.now();
    const after = performance.now();

    Assert.isTrue(before <= now && now <= after, `${before} <= ${now} <= ${after}`);
  }

  @TestMethod
  public async firesATimerOnlyOnceItsDelayHasPassedAsync(): Promise<void> {
    const clock = new SystemClock();
    let isLaterFired = false;
    const later = clock.setTimeout(() => {
      isLaterFired = true;
    }, 60_000);

    await new Promise<void>(resolve => clock.setTimeout(resolve, 0));
    clock.clearTimeout(later);

    Assert.isFalse(isLaterFired);
  }

  @TestMethod
  public async callsTheCallbackOnceTheTimerFiresAsync(): Promise<void> {
    const clock = new SystemClock();

    await new Promise<void>(resolve => clock.setTimeout(resolve, 0));
  }

  @TestMethod
  public clearsATimerSoItNoLongerKeepsTheLoopAlive(): void {
    const clock = new SystemClock();
    const resources = process.getActiveResourcesInfo().filter(t => t === "Timeout").length;
    const timer = clock.setTimeout(() => undefined, 60_000);

    Assert.areEqual(resources + 1, process.getActiveResourcesInfo().filter(t => t === "Timeout").length);
    clock.clearTimeout(timer);
    clock.clearTimeout(undefined);

    Assert.areEqual(resources, process.getActiveResourcesInfo().filter(t => t === "Timeout").length);
  }

  @TestMethod
  public armsATimerThatKeepsNoProcessAliveWhenAsked(): void {
    const clock = new SystemClock(false);
    const resources = process.getActiveResourcesInfo().filter(t => t === "Timeout").length;
    const timer = clock.setTimeout(() => undefined, 60_000);
    const resourcesWhileArmed = process.getActiveResourcesInfo().filter(t => t === "Timeout").length;
    clock.clearTimeout(timer);

    Assert.areEqual(resources, resourcesWhileArmed);
  }
}
