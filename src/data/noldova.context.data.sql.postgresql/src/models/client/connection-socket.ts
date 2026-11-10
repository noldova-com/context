/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import type { Buffer } from "node:buffer";

export abstract class ConnectionSocket {
  public onData: (data: Buffer) => void = () => undefined;
  public onDrain: () => void = () => undefined;
  public onClose: (error: Error | null) => void = () => undefined;

  public abstract get isClosed(): boolean;

  public abstract get isShared(): boolean;

  public abstract write(data: Buffer): boolean;

  public abstract end(data: Buffer): void;

  public abstract destroy(error?: Error | null): void;

  public abstract pause(): void;

  public abstract resume(): void;

  public abstract ref(): void;

  public abstract unref(): void;
}
