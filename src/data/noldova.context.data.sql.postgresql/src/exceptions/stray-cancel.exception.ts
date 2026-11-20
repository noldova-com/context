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

export class StrayCancelException extends DataException {
  public constructor(cause: Error) {
    super(Resources.strayCancel, new ExceptionOptions(cause));
  }
}
