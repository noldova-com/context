/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ExceptionOptions } from "@noldova/context.exceptions";

import { CommandHostException } from "./command-host.exception.js";

export class ProviderException extends CommandHostException {
  public readonly identity: string;

  public constructor(identity: string, message: string, options?: ExceptionOptions) {
    super(message, options);

    this.identity = identity;
  }
}
