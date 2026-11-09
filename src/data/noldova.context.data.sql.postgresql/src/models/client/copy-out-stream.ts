/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Readable } from "node:stream";

import type { CopyHost } from "../../services/client/copy-host.js";
import type { Exchange } from "./exchange.js";

export class CopyOutStream extends Readable {
  public count: number | null = null;
  public command: string | null = null;
  private readonly host: CopyHost;
  private readonly exchange: Exchange;

  public constructor(host: CopyHost, exchange: Exchange) {
    super();
    this.host = host;
    this.exchange = exchange;
  }

  public override _read(): void {
    this.host.readCopy(this.exchange);
  }

  public override _destroy(error: Error | null, callback: (error?: Error | null) => void): void {
    callback(error);
    this.host.abandonCopy(this.exchange);
  }
}
