/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";

import { CopyHost } from "@noldova/context.data.sql.postgresql/services/client/copy-host.js";
import type { Exchange } from "@noldova/context.data.sql.postgresql/models/client/exchange.js";

export class FakeCopyHost extends CopyHost {
  public readonly written: string[] = [];
  public readonly calls: string[] = [];
  public readonly exchanges: Exchange[] = [];
  public failure: Error | null = null;
  public onRead: () => void = () => undefined;

  public override writeCopyData(chunk: string | Uint8Array, callback: (error?: Error | null) => void): void {
    this.written.push(Buffer.from(chunk).toString("utf8"));
    callback();
  }

  public override finishCopy(exchange: Exchange, callback: (error?: Error | null) => void): void {
    this.record("finish", exchange);
    callback();
  }

  public override failCopy(exchange: Exchange, error: Error | null): void {
    this.failure = error;
    this.record("fail", exchange);
  }

  public override readCopy(exchange: Exchange): void {
    this.record("read", exchange);
    this.onRead();
  }

  public override abandonCopy(exchange: Exchange): void {
    this.record("abandon", exchange);
  }

  private record(call: string, exchange: Exchange): void {
    this.calls.push(call);
    this.exchanges.push(exchange);
  }
}
