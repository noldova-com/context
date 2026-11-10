/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";

import { Resources } from "../resources.js";

export class CancelUnansweredException extends DataException {
  public override readonly name: string = "CancelUnansweredException";
  public readonly seconds: number;
  public readonly silent: boolean;

  public constructor(seconds: number, silent: boolean) {
    super(silent ? Resources.formatCancelSilent(seconds) : Resources.formatCancelUnanswered(seconds));

    this.seconds = seconds;
    this.silent = silent;
  }
}
