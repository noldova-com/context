/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../resources.js";
import { PostgreSQLClientException } from "./postgresql-client.exception.js";

export class ConnectionEndedException extends PostgreSQLClientException {
  public readonly host: string;
  public readonly port: number;

  public constructor(host: string, port: number) {
    super(Resources.formatConnectionEnded(host, port));

    this.host = host;
    this.port = port;
  }
}
