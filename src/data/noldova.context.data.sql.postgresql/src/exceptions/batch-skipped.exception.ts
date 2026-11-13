/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";
import { ExceptionOptions } from "@noldova/context.exceptions";

import { Resources } from "../resources.js";

export class BatchSkippedException extends DataException {
  public readonly index: number;

  public constructor(index: number, cause: Error | null) {
    super(Resources.formatBatchSkipped(index), new ExceptionOptions(cause));

    this.index = index;
  }
}
