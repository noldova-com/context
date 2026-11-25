/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";

import type { IProcessIdentity } from "../interfaces/i-process-identity.js";
import { Resources } from "../resources.js";
import { ProcessLister } from "../services/process-lister.js";

export class ProcessIdentity implements IProcessIdentity {
  public readonly processId: number;
  public readonly startTime: number;

  public constructor(processId: number, startTime: number) {
    ArgumentOutOfRangeException.throwIfNotPositiveInteger(processId, Resources.processIdParameterName);
    ArgumentOutOfRangeException.throwIfNotInteger(startTime, Resources.startTimeParameterName);
    ArgumentOutOfRangeException.throwIfNegative(startTime, Resources.startTimeParameterName);

    this.processId = processId;
    this.startTime = startTime;
  }

  public static async readAsync(processId: number): Promise<ProcessIdentity | undefined> {
    ArgumentOutOfRangeException.throwIfNotPositiveInteger(processId, Resources.processIdParameterName);

    const entries = await ProcessLister.useAsync(Resources.readLimitMilliseconds, t => t.listAsync());
    return entries.firstOrDefault(t => t.processId === processId && !t.isZombie)?.identity;
  }
}
