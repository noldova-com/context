/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import type { Buffer } from "node:buffer";
import { setImmediate } from "node:timers";

import "@noldova/context.core";
import { DataException } from "@noldova/context.data";
import { ChannelBinding } from "@noldova/context.data.sql.postgresql/enums/channel-binding.js";
import { SslMode } from "@noldova/context.data.sql.postgresql/enums/ssl-mode.js";
import { BuiltQuery } from "@noldova/context.data.sql.postgresql/models/built-query.js";
import { ClientOptions } from "@noldova/context.data.sql.postgresql/models/client-options.js";
import { ConnectionOptions } from "@noldova/context.data.sql.postgresql/models/connection-options.js";
import { SystemCertificates } from "@noldova/context.data.sql.postgresql/models/system-certificates.js";
import type { PoolLease } from "@noldova/context.data.sql.postgresql/models/client/pool-lease.js";
import { PostgreSQLPool } from "@noldova/context.data.sql.postgresql/models/client/postgresql-pool.js";
import { Query } from "@noldova/context.data.sql.postgresql/models/client/query.js";
import { TypeRegistry } from "@noldova/context.data.sql.postgresql/models/type-registry.js";

import { BackendMessages as M } from "./backend-messages.fixture.js";
import { FakePoolStarter } from "./fake-pool-starter.fixture.js";
import type { FakeSocket } from "./fake-socket.fixture.js";
import { FakeTimers } from "./fake-timers.fixture.js";

export class PoolHarness {
  public readonly timers: FakeTimers = new FakeTimers();
  public readonly options: ClientOptions;
  public readonly connection: ConnectionOptions;
  public readonly registry: TypeRegistry;
  public readonly starters: FakePoolStarter[] = [];
  public readonly pool: PostgreSQLPool;
  public automatic: boolean = true;

  public constructor(values: Partial<ClientOptions> = {}, connectTimeout: number = 0) {
    this.options = new ClientOptions({ fetchTypes: false, maxLifetime: null, backoff: 1, ...values, timers: this.timers });
    this.connection = new ConnectionOptions("localhost", 5432, "app", "app", "", SslMode.Disable, ChannelBinding.Disable, connectTimeout, new Map(), new SystemCertificates());
    this.registry = new TypeRegistry(this.options);
    this.pool = new PostgreSQLPool(this.options, this.connection, this.registry, options => this.start(options));
  }

  public static done(): Buffer[] {
    return [M.commandComplete("SELECT 0"), M.readyForQuery()];
  }

  public static prepared(): Buffer[] {
    return [M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery()];
  }

  public starter(index: number): FakePoolStarter {
    const starter = this.starters[index];
    if (Object.isUndefined(starter))
      throw new DataException("The starter was not created.");

    return starter;
  }

  public socket(index: number): FakeSocket {
    return this.starter(index).socket;
  }

  public query(text: string, values: readonly unknown[] = [], oids: readonly number[] = []): Query {
    return new Query(new BuiltQuery(text, values, oids), this.pool);
  }

  public leased(lease: PoolLease, text: string): Query {
    return new Query(new BuiltQuery(text, [], []), lease);
  }

  public answer(index: number, ...messages: Buffer[]): void {
    this.socket(index).receive(...messages);
  }

  public async untilAsync(condition: () => boolean): Promise<boolean> {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      this.timers.tick();
      if (condition())
        return true;
      await new Promise<void>(resolve => setImmediate(resolve));
    }

    return condition();
  }

  public async writtenAsync(index: number): Promise<string> {
    await this.untilAsync(() => this.starters.length > index && this.socket(index).written.length > 0);
    return this.starters.length > index ? this.socket(index).take() : "";
  }

  private start(options: ConnectionOptions): FakePoolStarter {
    const starter = new FakePoolStarter(options);
    this.starters.push(starter);
    if (this.automatic)
      starter.open();
    return starter;
  }
}
