/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";
import { ExceptionOptions } from "@noldova/context.exceptions";

import { Resources } from "../resources.js";

export class ConnectionClosedException extends DataException {
  public override readonly name: string = "ConnectionClosedException";
  public readonly destroyed: boolean;
  public readonly host: string;
  public readonly port: number;

  public constructor(destroyed: boolean, host: string, port: number, cause: Error | null) {
    super(destroyed ? Resources.formatConnectionDestroyed(host, port) : Resources.formatConnectionClosed(host, port), new ExceptionOptions(cause));

    this.destroyed = destroyed;
    this.host = host;
    this.port = port;
  }
}
