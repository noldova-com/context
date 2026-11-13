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

export class QueryTimeoutException extends DataException {
  public readonly seconds: number;

  public constructor(seconds: number, cause: unknown) {
    super(Resources.formatQueryTimeout(seconds), new ExceptionOptions(cause));

    this.seconds = seconds;
  }
}
