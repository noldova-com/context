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

export class StrayCancelException extends PostgreSQLClientException {
  public constructor(cause: Error) {
    super(Resources.strayCancel, new ExceptionOptions(cause));
  }
}
