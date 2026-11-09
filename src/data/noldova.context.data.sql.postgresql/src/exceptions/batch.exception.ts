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

export class BatchException extends DataException {
  public override readonly name: string = "BatchException";
  public readonly index: number;

  public constructor(index: number, cause: Error) {
    super(Resources.formatBatchFailed(index), new ExceptionOptions(cause));

    this.index = index;
  }
}
