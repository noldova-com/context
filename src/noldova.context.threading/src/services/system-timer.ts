/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import type { ITimer } from "../interfaces/i-timer.js";

export class SystemTimer implements ITimer {
  public setTimeout(callback: () => void, delayMilliseconds: number): number {
    return Number(setTimeout(callback, delayMilliseconds));
  }

  public clearTimeout(timer: number | undefined): void {
    clearTimeout(timer);
  }
}
