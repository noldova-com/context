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

export class QueryTimeoutException extends PostgreSQLClientException {
  public readonly seconds: number;

  public constructor(seconds: number, cause: unknown) {
    super(Resources.formatQueryTimeout(seconds), new ExceptionOptions(cause));

    this.seconds = seconds;
  }
}
