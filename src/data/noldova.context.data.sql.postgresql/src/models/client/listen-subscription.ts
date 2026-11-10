/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { BackendKey } from "../backend-key.js";
import type { ChannelListener } from "../channel-listener.js";
import type { ListenChannel } from "../listen-channel.js";
import type { ClientListener } from "./client-listener.js";

export class ListenSubscription {
  private readonly owner: ClientListener;
  private readonly name: string;
  private readonly channel: ListenChannel;
  private readonly listener: ChannelListener;

  public constructor(owner: ClientListener, name: string, channel: ListenChannel, listener: ChannelListener) {
    this.owner = owner;
    this.name = name;
    this.channel = channel;
    this.listener = listener;
  }

  public get state(): BackendKey | null {
    return this.channel.state;
  }

  public unlistenAsync(): Promise<void> {
    return this.owner.unlistenAsync(this.name, this.channel, this.listener);
  }
}
