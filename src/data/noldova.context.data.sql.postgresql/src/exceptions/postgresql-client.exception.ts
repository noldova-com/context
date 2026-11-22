/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";
import type { ExceptionOptions } from "@noldova/context.exceptions";

export abstract class PostgreSQLClientException extends DataException {
  protected constructor(message: string, options?: ExceptionOptions) {
    super(message, options);
  }
}
