/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { ConnectionClosedException } from "../../exceptions/connection-closed.exception.js";
import { ConnectionEndedException } from "../../exceptions/connection-ended.exception.js";
import type { BackendKey } from "../backend-key.js";
import { BuiltQuery } from "../built-query.js";
import { ChannelListener } from "../channel-listener.js";
import { ClientOptions } from "../client-options.js";
import type { ConnectionOptions } from "../connection-options.js";
import { ListenChannel } from "../listen-channel.js";
import { QueryOptions } from "../query-options.js";
import { Resources } from "../../resources.js";
import { SessionStarter } from "../../services/session-starter.js";
import { TypeRegistry } from "../type-registry.js";
import { ListenSubscription } from "./listen-subscription.js";
import { PostgreSQLPool } from "./postgresql-pool.js";
import { Query } from "./query.js";
import { SqlRunner } from "../../services/client/sql-runner.js";

export class ClientListener {
  private static readonly holdTime: number = 2 ** 30;

  private readonly options: ClientOptions;
  private readonly connection: ConnectionOptions;
  private readonly channels: Map<string, ListenChannel> = new Map();
  private pool: PostgreSQLPool | null = null;
  private closing: Promise<void> | null = null;
  private alive: number | null = null;

  public constructor(options: ClientOptions, connection: ConnectionOptions) {
    this.options = options;
    this.connection = connection;
  }

  public async listenAsync(name: string, callback: (payload: string) => void, onlisten: (() => void) | null = null): Promise<ListenSubscription> {
    const listener = new ChannelListener(callback, onlisten);
    const channel = this.channels.get(name) ?? this.open(name);
    channel.listeners.add(listener);
    this.hold();
    let state: BackendKey | null;
    try {
      state = await channel.result;
    }
    catch (error) {
      channel.listeners.delete(listener);
      if (channel.listeners.size === 0)
        this.channels.delete(name);
      if (this.channels.size === 0)
        this.release();
      throw error;
    }

    channel.state = state;
    listener.onlisten?.();
    return new ListenSubscription(this, name, channel, listener);
  }

  public async unlistenAsync(name: string, channel: ListenChannel, listener: ChannelListener): Promise<void> {
    if (!channel.listeners.delete(listener) || channel.listeners.size > 0)
      return;

    if (this.channels.get(name) === channel)
      this.channels.delete(name);
    this.options.timers.clearTimeout(channel.timer);
    channel.timer = null;
    if (this.channels.size === 0)
      this.release();
    const pool = this.pool;
    if (!Object.isNull(this.closing) || Object.isNull(pool))
      return;

    try {
      await ClientListener.runStatementAsync(pool, Resources.unlistenPrefix + SqlRunner.quote(name));
    }
    catch (error) {
      if (!(error instanceof ConnectionClosedException || error instanceof ConnectionEndedException))
        throw error;
    }
  }

  public endAsync(): Promise<void> {
    this.release();
    for (const channel of this.channels.values())
      this.options.timers.clearTimeout(channel.timer);
    this.closing ??= Object.isNull(this.pool) ? Promise.resolve() : this.pool.endAsync(0);
    return this.closing;
  }

  private open(name: string): ListenChannel {
    const channel = new ListenChannel(this.start(name));
    this.channels.set(name, channel);
    return channel;
  }

  private connect(): PostgreSQLPool {
    if (!Object.isNull(this.pool))
      return this.pool;

    const options = new ClientOptions({
      ...this.options,
      queryTimeout: 0,
      max: 1,
      idleTimeout: null,
      maxLifetime: null,
      unrefSockets: true,
      fetchTypes: false,
      onclose: () => this.handleClose(),
      onnotify: (channel, payload) => this.handleNotification(channel, payload)
    });
    this.pool = new PostgreSQLPool(options, this.connection, new TypeRegistry(options), values => new SessionStarter(values, options.cancelTimeout));
    return this.pool;
  }

  private handleClose(): void {
    if (Object.isNull(this.closing))
      for (const [name, channel] of this.channels)
        this.relisten(channel, name, 0);
  }

  private handleNotification(name: string, payload: string): void {
    const channel = this.channels.get(name);
    if (!Object.isUndefined(channel))
      for (const listener of [...channel.listeners])
        listener.callback(payload);
  }

  private relisten(channel: ListenChannel, name: string, retries: number): void {
    channel.timer = null;
    channel.result = this.start(name);
    channel.result.then(state => {
      channel.state = state;
      for (const listener of channel.listeners)
        listener.onlisten?.();
    }, () => {
      if (this.isCurrent(name, channel))
        this.retry(channel, name, retries + 1);
    });
  }

  private retry(channel: ListenChannel, name: string, retries: number): void {
    const backoff = this.options.backoff;
    const seconds = Object.isFunction(backoff) ? backoff(retries) : backoff;
    channel.timer = this.options.timers.setTimeout(() => {
      if (this.isCurrent(name, channel))
        this.relisten(channel, name, retries);
    }, seconds * 1000);
  }

  private isCurrent(name: string, channel: ListenChannel): boolean {
    return Object.isNull(this.closing) && this.channels.get(name) === channel;
  }

  private start(name: string): Promise<BackendKey | null> {
    return ClientListener.runStatementAsync(this.connect(), Resources.listenPrefix + SqlRunner.quote(name));
  }

  private hold(): void {
    this.alive ??= this.options.timers.setTimeout(() => {
      this.alive = null;
      this.hold();
    }, ClientListener.holdTime);
  }

  private release(): void {
    this.options.timers.clearTimeout(this.alive);
    this.alive = null;
  }

  private static async runStatementAsync(pool: PostgreSQLPool, text: string): Promise<BackendKey | null> {
    const query = new Query(new BuiltQuery(text, [], []), pool, new QueryOptions(true, false));
    await query;
    return query.state;
  }
}
