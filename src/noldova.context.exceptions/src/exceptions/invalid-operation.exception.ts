/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ExceptionOptions } from "../models/exception-options.js";
import { Resources } from "../resources.js";
import { Exception } from "./exception.js";

export class InvalidOperationException extends Exception {
  public constructor(message: string = Resources.invalidOperation, options?: ExceptionOptions) {
    super(message, options);
  }
}
