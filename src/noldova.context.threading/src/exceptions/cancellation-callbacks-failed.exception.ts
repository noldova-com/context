/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../resources.js";
import { ThreadingException } from "./threading.exception.js";

export class CancellationCallbacksFailedException extends ThreadingException {
  public readonly errors: readonly unknown[];

  public constructor(errors: readonly unknown[]) {
    super(Resources.callbacksFailed);

    this.errors = errors;
  }
}
