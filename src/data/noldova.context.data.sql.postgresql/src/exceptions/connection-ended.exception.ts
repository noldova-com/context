/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";

import { Resources } from "../resources.js";

export class ConnectionEndedException extends DataException {
  public readonly host: string;
  public readonly port: number;

  public constructor(host: string, port: number) {
    super(Resources.formatConnectionEnded(host, port));

    this.host = host;
    this.port = port;
  }
}
