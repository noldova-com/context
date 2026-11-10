/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { DataException } from "@noldova/context.data";
import { ChannelBinding } from "@noldova/context.data.sql.postgresql/enums/channel-binding.js";
import { SslMode } from "@noldova/context.data.sql.postgresql/enums/ssl-mode.js";
import { BuiltQuery } from "@noldova/context.data.sql.postgresql/models/built-query.js";
import { ClientOptions } from "@noldova/context.data.sql.postgresql/models/client-options.js";
import { ConnectionOptions } from "@noldova/context.data.sql.postgresql/models/connection-options.js";
import { SystemCertificates } from "@noldova/context.data.sql.postgresql/models/system-certificates.js";
import { Result } from "@noldova/context.data.sql.postgresql/models/result.js";
import type { PoolLease } from "@noldova/context.data.sql.postgresql/models/client/pool-lease.js";
import { PostgreSQLPool } from "@noldova/context.data.sql.postgresql/models/client/postgresql-pool.js";
import { Query } from "@noldova/context.data.sql.postgresql/models/client/query.js";
import type { QueryHandler } from "@noldova/context.data.sql.postgresql/services/client/query-handler.js";
import { SessionStarter } from "@noldova/context.data.sql.postgresql/services/session-starter.js";
import { TypeRegistry } from "@noldova/context.data.sql.postgresql/models/type-registry.js";
import type { QueryOutcome } from "@noldova/context.data.sql.postgresql/types/query-outcome.js";

import { PostgreSQLServerFixture } from "./postgresql-server.fixture.js";
import { Released } from "./released.fixture.js";

export class RealPool implements AsyncDisposable {
  public readonly options: ClientOptions;
  public readonly connection: ConnectionOptions;
  public readonly registry: TypeRegistry;
  public readonly pool: PostgreSQLPool;

  public constructor(values: Partial<ClientOptions> = {}, parameters: ReadonlyMap<string, string> = new Map()) {
    const server = PostgreSQLServerFixture.current();
    this.options = new ClientOptions({ maxLifetime: null, ...values });
    this.connection = new ConnectionOptions(server.host, server.port, server.database, server.user, "", SslMode.Disable, ChannelBinding.Prefer, 5, parameters, new SystemCertificates());
    this.registry = new TypeRegistry(this.options);
    this.pool = new PostgreSQLPool(this.options, this.connection, this.registry, options => new SessionStarter(options, this.options.cancelTimeout));
  }

  public static result(outcome: QueryOutcome): Result {
    if (outcome instanceof Result)
      return outcome;

    throw new DataException("The query did not give one result.");
  }

  public static results(outcome: QueryOutcome): Result[] {
    if (RealPool.isList(outcome))
      return outcome.map(item => RealPool.result(item));

    throw new DataException("The query did not give several results.");
  }

  public query(text: string, values: readonly unknown[] = [], oids: readonly number[] = [], handler: QueryHandler | null = null): Query {
    return new Query(new BuiltQuery(text, values, oids.length > 0 ? oids : values.map(() => 0)), handler ?? this.pool);
  }

  public leased(lease: PoolLease, text: string, values: readonly unknown[] = []): Query {
    return this.query(text, values, [], lease);
  }

  public batch(...parts: Query[]): Query {
    const query = this.query("");
    query.parts = parts;
    return query;
  }

  public async rowsAsync(text: string, values: readonly unknown[] = []): Promise<Result> {
    return RealPool.result(await this.query(text, values));
  }

  public async endAsync(): Promise<boolean> {
    await this.pool.endAsync();
    return Released.socketsAsync();
  }

  public async [Symbol.asyncDispose](): Promise<void> {
    await this.pool.endAsync(0);
  }

  private static isList(outcome: QueryOutcome): outcome is readonly QueryOutcome[] {
    return Array.isArray(outcome) && !(outcome instanceof Result);
  }
}
