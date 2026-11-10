/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ClientTimers } from "@noldova/context.data.sql.postgresql/models/client/client-timers.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ClientTimersTests {
  @TestMethod
  public async runsATimerAndForgetsItAsync(): Promise<void> {
    const timers = new ClientTimers();
    const fired: number[] = [];

    await new Promise<void>(resolve => {
      const id = timers.setTimeout(() => {
        fired.push(id);
        resolve();
      }, 1);
    });
    timers.clearTimeout(fired[0] ?? 0);

    Assert.areEqual(1, fired.length);
    Assert.areEqual(1, fired[0]);
  }

  @TestMethod
  public async clearsATimerBeforeItRunsAsync(): Promise<void> {
    const timers = new ClientTimers();
    const fired: string[] = [];

    const cleared = timers.setTimeout(() => fired.push("cleared"), 1);
    timers.clearTimeout(cleared);
    timers.clearTimeout(null);
    timers.clearTimeout(cleared + 100);
    await new Promise<void>(resolve => {
      timers.setTimeout(() => {
        fired.push("kept");
        resolve();
      }, 1);
    });

    Assert.areEqual("kept", fired.join(","));
  }

  @TestMethod
  public async unrefsATimerThatStillRunsAsync(): Promise<void> {
    const timers = new ClientTimers();
    let fired = false;

    await new Promise<void>(resolve => {
      const id = timers.setTimeout(() => {
        fired = true;
        resolve();
      }, 1);
      timers.unref(id);
      timers.unref(id + 100);
    });

    Assert.isTrue(fired);
  }

  @TestMethod
  public async measuresTimeAndRunsOnTheNextTickAsync(): Promise<void> {
    const timers = new ClientTimers();
    const order: string[] = [];
    const before = timers.readTime();

    const ticked = new Promise<void>(resolve => {
      timers.nextTick(() => {
        order.push("tick");
        resolve();
      });
    });
    order.push("sync");
    await ticked;

    Assert.areEqual("sync,tick", order.join(","));
    Assert.isTrue(timers.readTime() >= before);
  }
}
