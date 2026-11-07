/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";

import { Resources } from "../../resources.js";

// A test's time limit, which the worker's main thread extends by its grace before it stops the worker, so the extended limit must still fit a timer.
export class TestTimeoutLimit {
  public static isValid(timeoutMilliseconds: unknown): timeoutMilliseconds is number {
    return Object.isNumber(timeoutMilliseconds) && Number.isInteger(timeoutMilliseconds) && timeoutMilliseconds > 0
      && timeoutMilliseconds + Resources.testWorkerGraceMilliseconds <= Resources.maximumTimeoutMilliseconds;
  }

  public static throwIfInvalid(timeoutMilliseconds: number): void {
    ArgumentOutOfRangeException.throwIfNotPositiveInteger(timeoutMilliseconds, Resources.timeoutMillisecondsParameter, Resources.timeoutInvalid);
    if (!TestTimeoutLimit.isValid(timeoutMilliseconds))
      throw new ArgumentOutOfRangeException(Resources.timeoutMillisecondsParameter, timeoutMilliseconds, Resources.timeoutTooLarge);
  }
}
