/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";

import { Resources } from "../resources.js";

export class CallbacksFailedException extends DataException {
  public readonly errors: readonly Error[];

  public constructor(errors: readonly Error[]) {
    super(Resources.callbacksFailed);

    this.errors = errors;
  }
}
