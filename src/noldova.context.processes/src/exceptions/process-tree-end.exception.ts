/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";

import type { ProcessIdentity } from "../models/process-identity.js";
import { Resources } from "../resources.js";
import { ProcessesException } from "./processes.exception.js";

export class ProcessTreeEndException extends ProcessesException {
  public readonly survivors: IReadOnlyList<ProcessIdentity>;

  public constructor(survivors: IReadOnlyList<ProcessIdentity>, limitMilliseconds: number) {
    super(Resources.formatTreeNotEnded(survivors.select(t => Resources.formatSurvivor(t.processId, t.startTime)).toList(), limitMilliseconds));

    this.survivors = survivors;
  }
}
