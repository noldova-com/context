/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import type { IClock } from "../../interfaces/i-clock.js";

export class SystemClock implements IClock {
  private readonly keepsProcessAlive: boolean;

  public constructor(keepsProcessAlive: boolean = true) {
    this.keepsProcessAlive = keepsProcessAlive;
  }

  public now(): number {
    return performance.now();
  }

  public setTimeout(callback: () => void, delayMilliseconds: number): number {
    const timer = setTimeout(callback, delayMilliseconds);
    if (!this.keepsProcessAlive)
      timer.unref();

    return Number(timer);
  }

  public clearTimeout(timer: number | undefined): void {
    clearTimeout(timer);
  }
}
