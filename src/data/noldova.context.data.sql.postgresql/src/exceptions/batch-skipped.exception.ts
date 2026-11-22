/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ExceptionOptions } from "@noldova/context.exceptions";

import { Resources } from "../resources.js";
import { PostgreSQLClientException } from "./postgresql-client.exception.js";

export class BatchSkippedException extends PostgreSQLClientException {
  public readonly index: number;

  public constructor(index: number, cause: Error | null) {
    super(Resources.formatBatchSkipped(index), new ExceptionOptions(cause));

    this.index = index;
  }
}
