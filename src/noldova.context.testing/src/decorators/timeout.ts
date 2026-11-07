/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TestMarks } from "../models/decorators/test-marks.js";
import { TestTimeoutLimit } from "../models/execution/test-timeout-limit.js";

export function Timeout(timeoutMilliseconds: number): (value: Function) => void {
  TestTimeoutLimit.throwIfInvalid(timeoutMilliseconds);

  return (t: Function): void => {
    Object.defineProperty(t, TestMarks.TIMEOUT, { value: timeoutMilliseconds, writable: false, enumerable: false, configurable: false });
  };
}
