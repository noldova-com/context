/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { ArgumentException } from "@noldova/context.exceptions";

import { LeaseKind } from "../../enums/lease-kind.js";
import type { ClientConfiguration } from "../client-configuration.js";
import type { ClientOptions } from "../client-options.js";
import type { ConnectionOptions } from "../connection-options.js";
import type { PoolStats } from "../pool-stats.js";
import { TransactionState } from "../transaction-state.js";
import { Resources } from "../../resources.js";
import type { ClientSettings } from "../../types/client-settings.js";
import type { TransactionResult } from "../../types/transaction-result.js";
import { ClientOptionsParser } from "../../services/client-options.parser.js";
import { SessionStarter } from "../../services/session-starter.js";
import { TypeRegistry } from "../type-registry.js";
import { ClientListener } from "./client-listener.js";
import type { ListenSubscription } from "./listen-subscription.js";
import { PostgreSQLPool } from "./postgresql-pool.js";
import type { QueryHandler } from "../../services/client/query-handler.js";
import { ReservedClient } from "./reserved-client.js";
import { SqlRunner } from "../../services/client/sql-runner.js";
import { TransactionScope } from "./transaction-scope.js";

export class PostgreSQLClient extends SqlRunner implements AsyncDisposable {
  public readonly options: ClientOptions;
  public readonly connection: ConnectionOptions;
  private readonly pool: PostgreSQLPool;
  private readonly listener: ClientListener;

  private constructor(options: ClientOptions, connection: ConnectionOptions, types: TypeRegistry) {
    super(types);
    this.options = options;
    this.connection = connection;
    this.pool = new PostgreSQLPool(options, connection, types, values => new SessionStarter(values, options.cancelTimeout));
    this.listener = new ClientListener(options, connection);
  }

  public get parameters(): ReadonlyMap<string, string> {
    return this.pool.parameters;
  }

  public get stats(): PoolStats {
    return this.pool.stats;
  }

  protected override get handler(): QueryHandler {
    return this.pool;
  }

  public static create(location: string | null = null, settings: ClientSettings = {}): PostgreSQLClient {
    return PostgreSQLClient.createFrom(ClientOptionsParser.parse(location, settings));
  }

  public static createFrom(configuration: ClientConfiguration): PostgreSQLClient {
    const types = new TypeRegistry(configuration.options);
    if (types.named && !configuration.options.fetchTypes)
      throw new ArgumentException(Resources.namedTypesNeedFetch, Resources.typesParameterName);

    return new PostgreSQLClient(configuration.options, configuration.connection, types);
  }

  public async reserveAsync(): Promise<ReservedClient> {
    return new ReservedClient(this.types, await this.pool.acquireLeaseAsync(LeaseKind.Reserve));
  }

  public beginAsync<T>(callback: (scope: TransactionScope) => T): Promise<TransactionResult<T>>;
  public beginAsync<T>(mode: string, callback: (scope: TransactionScope) => T): Promise<TransactionResult<T>>;
  public beginAsync<T>(mode: string | ((scope: TransactionScope) => T), callback?: (scope: TransactionScope) => T): Promise<unknown> {
    return Object.isString(mode) ? this.runInTransactionAsync(mode, callback) : this.runInTransactionAsync(String.empty, mode);
  }

  public listenAsync(channel: string, callback: (payload: string) => void, onlisten: (() => void) | null = null): Promise<ListenSubscription> {
    return this.listener.listenAsync(channel, callback, onlisten);
  }

  public async endAsync(timeout: number | null = null): Promise<void> {
    await this.listener.endAsync();
    await this.pool.endAsync(timeout);
  }

  public closeAsync(): Promise<void> {
    return this.pool.closeAsync();
  }

  public [Symbol.asyncDispose](): Promise<void> {
    return this.endAsync();
  }

  private async runInTransactionAsync(mode: string, callback: ((scope: TransactionScope) => unknown) | undefined): Promise<unknown> {
    const lease = await this.pool.acquireLeaseAsync(LeaseKind.Transaction);
    try {
      await TransactionScope.runControl(lease, Resources.beginPrefix + mode.replace(/[^a-z ]/giu, String.empty));
      const done = new TransactionScope(this.types, new TransactionState(lease, mode), null, false, () => false).runAsync(callback);
      done.catch(() => undefined);
      return await Promise.race([done, lease.closed]);
    }
    finally {
      lease.release();
    }
  }
}
