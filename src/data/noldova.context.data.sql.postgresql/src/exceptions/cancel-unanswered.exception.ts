/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../resources.js";
import { PostgreSQLClientException } from "./postgresql-client.exception.js";

export class CancelUnansweredException extends PostgreSQLClientException {
  public readonly seconds: number;
  public readonly silent: boolean;

  public constructor(seconds: number, silent: boolean) {
    super(silent ? Resources.formatCancelSilent(seconds) : Resources.formatCancelUnanswered(seconds));

    this.seconds = seconds;
    this.silent = silent;
  }
}
