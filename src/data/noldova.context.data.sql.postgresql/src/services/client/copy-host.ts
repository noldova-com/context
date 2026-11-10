/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Exchange } from "../../models/client/exchange.js";

export abstract class CopyHost {
  public abstract writeCopyData(chunk: string | Uint8Array, callback: (error?: Error | null) => void): void;

  public abstract finishCopy(exchange: Exchange, callback: (error?: Error | null) => void): void;

  public abstract failCopy(exchange: Exchange, error: Error | null): void;

  public abstract readCopy(exchange: Exchange): void;

  public abstract abandonCopy(exchange: Exchange): void;
}
