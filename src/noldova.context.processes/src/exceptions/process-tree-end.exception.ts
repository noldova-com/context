/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ProcessIdentity } from "../models/process-identity.js";
import { Resources } from "../resources.js";
import { ProcessesException } from "./processes.exception.js";

export class ProcessTreeEndException extends ProcessesException {
  public readonly survivors: readonly ProcessIdentity[];

  public constructor(survivors: readonly ProcessIdentity[], limitMilliseconds: number) {
    super(Resources.formatTreeNotEnded(survivors.map(t => Resources.formatSurvivor(t.processId, t.startTime)), limitMilliseconds));

    this.survivors = survivors;
  }
}
