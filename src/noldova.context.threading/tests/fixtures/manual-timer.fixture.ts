/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import type { ITimer } from "@noldova/context.threading";

import { PendingTimer } from "./pending-timer.fixture.js";

export class ManualTimer implements ITimer {
  private readonly pending: Map<number, PendingTimer> = new Map<number, PendingTimer>();
  private nextTimer: number = 1;
  private now: number = 0;

  public get pendingCount(): number {
    return this.pending.size;
  }

  public setTimeout(callback: () => void, delayMilliseconds: number): number {
    const timer = this.nextTimer++;
    this.pending.set(timer, new PendingTimer(callback, this.now + delayMilliseconds));

    return timer;
  }

  public clearTimeout(timer: number | undefined): void {
    if (!Object.isUndefined(timer))
      this.pending.delete(timer);
  }

  public advance(milliseconds: number): void {
    this.now += milliseconds;
    for (const [timer, entry] of [...this.pending]) {
      if (entry.due > this.now)
        continue;

      this.pending.delete(timer);
      entry.callback();
    }
  }
}
