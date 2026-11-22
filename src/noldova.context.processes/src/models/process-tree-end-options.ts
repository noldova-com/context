/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";

import { Resources } from "../resources.js";

export class ProcessTreeEndOptions {
  public readonly graceMilliseconds: number;
  public readonly limitMilliseconds: number;

  public constructor(graceMilliseconds: number = Resources.defaultGraceMilliseconds, limitMilliseconds: number = Resources.defaultLimitMilliseconds) {
    ProcessTreeEndOptions.throwIfNotMilliseconds(graceMilliseconds, Resources.graceMillisecondsParameterName);
    ProcessTreeEndOptions.throwIfNotMilliseconds(limitMilliseconds, Resources.limitMillisecondsParameterName);

    this.graceMilliseconds = graceMilliseconds;
    this.limitMilliseconds = limitMilliseconds;
  }

  private static throwIfNotMilliseconds(value: number, parameterName: string): void {
    ArgumentOutOfRangeException.throwIfNotInteger(value, parameterName);
    ArgumentOutOfRangeException.throwIfNegative(value, parameterName);
  }
}
