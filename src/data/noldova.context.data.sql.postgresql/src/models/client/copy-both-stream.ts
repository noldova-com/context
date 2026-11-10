/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import type { Buffer } from "node:buffer";
import { Duplex } from "node:stream";

import type { CopyHost } from "../../services/client/copy-host.js";
import type { Exchange } from "./exchange.js";

export class CopyBothStream extends Duplex {
  public count: number | null = null;
  public command: string | null = null;
  private readonly host: CopyHost;
  private readonly exchange: Exchange;

  public constructor(host: CopyHost, exchange: Exchange) {
    super({ autoDestroy: true });
    this.host = host;
    this.exchange = exchange;
  }

  public override _write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    this.host.writeCopyData(chunk, callback);
  }

  public override _final(callback: (error?: Error | null) => void): void {
    this.host.finishCopy(this.exchange, callback);
  }

  public override _destroy(error: Error | null, callback: (error?: Error | null) => void): void {
    callback(error);
    this.host.failCopy(this.exchange, error);
  }

  public override _read(): void {
    this.host.readCopy(this.exchange);
  }
}
