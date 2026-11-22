/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import CommandFailedException from "./command-failed.exception.ts";

export default class PostgreSQLStartFailedException extends CommandFailedException {
  public readonly startFailure: unknown;
  public readonly stopFailure: unknown;

  public constructor(message: string, startFailure: unknown, stopFailure: unknown) {
    super(message, { cause: startFailure });
    this.startFailure = startFailure;
    this.stopFailure = stopFailure;
  }
}
