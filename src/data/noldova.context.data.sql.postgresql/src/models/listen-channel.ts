/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { BackendKey } from "./backend-key.js";
import type { ChannelListener } from "./channel-listener.js";

export class ListenChannel {
  public readonly listeners: Set<ChannelListener> = new Set();
  public result: Promise<BackendKey | null>;
  public state: BackendKey | null = null;
  public timer: number | null = null;

  public constructor(result: Promise<BackendKey | null>) {
    this.result = result;
  }
}
