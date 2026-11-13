/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";

import { Resources } from "../resources.js";

export class QueueTimeoutException extends DataException {
  public readonly seconds: number;

  public constructor(seconds: number) {
    super(Resources.formatQueueTimeout(seconds));

    this.seconds = seconds;
  }
}
