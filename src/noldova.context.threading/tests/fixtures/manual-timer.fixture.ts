/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import type { ITimer } from "@noldova/context.threading";

export class ManualTimer implements ITimer {
  private readonly pending: Map<number, { callback: () => void; due: number }> = new Map<number, { callback: () => void; due: number }>();
  private nextTimer: number = 1;
  private now: number = 0;

  public get pendingCount(): number {
    return this.pending.size;
  }

  public setTimeout(callback: () => void, delayMilliseconds: number): number {
    const timer = this.nextTimer++;
    this.pending.set(timer, { callback, due: this.now + delayMilliseconds });

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
