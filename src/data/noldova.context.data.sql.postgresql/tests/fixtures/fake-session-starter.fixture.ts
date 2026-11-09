/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { ChannelBinding } from "@noldova/context.data.sql.postgresql/enums/channel-binding.js";
import { SslMode } from "@noldova/context.data.sql.postgresql/enums/ssl-mode.js";
import type { BackendKey } from "@noldova/context.data.sql.postgresql/models/backend-key.js";
import { ConnectionOptions } from "@noldova/context.data.sql.postgresql/models/connection-options.js";
import { SessionStarter } from "@noldova/context.data.sql.postgresql/services/session-starter.js";

export class FakeSessionStarter extends SessionStarter {
  public readonly cancelled: BackendKey[] = [];
  public failure: Error | null = null;

  public constructor() {
    super(new ConnectionOptions("localhost", 5432, "app", "app", "", SslMode.Disable, ChannelBinding.Disable, 0, new Map()));
  }

  public override cancelAsync(backend: BackendKey, _signal: AbortSignal): Promise<void> {
    this.cancelled.push(backend);
    return Object.isNull(this.failure) ? Promise.resolve() : Promise.reject(this.failure);
  }
}
