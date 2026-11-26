/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ExceptionOptions } from "@noldova/context.exceptions";

import { CancellationToken } from "../models/cancellation-token.js";
import { Resources } from "../resources.js";
import { ThreadingException } from "./threading.exception.js";

export class OperationCanceledException extends ThreadingException {
  public readonly cancellationToken: CancellationToken;

  public constructor(message: string = Resources.operationCanceled, cancellationToken: CancellationToken = CancellationToken.none, options?: ExceptionOptions) {
    super(message, options);

    this.cancellationToken = cancellationToken;
  }
}
