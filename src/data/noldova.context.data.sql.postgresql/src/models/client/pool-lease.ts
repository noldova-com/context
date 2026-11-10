/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { LeaseKind } from "../../enums/lease-kind.js";
import { TransactionStatus } from "../../enums/transaction-status.js";
import { UnsafeTransactionException } from "../../exceptions/unsafe-transaction.exception.js";
import type { ClientOptions } from "../client-options.js";
import { Resources } from "../../resources.js";
import { ConnectionLease } from "../../services/client/connection-lease.js";
import { Deferred } from "./deferred.js";
import type { PostgreSQLConnection } from "./postgresql-connection.js";
import type { PostgreSQLPool } from "./postgresql-pool.js";
import type { Query } from "./query.js";
import type { QueryHandler } from "../../services/client/query-handler.js";

export class PoolLease extends ConnectionLease implements QueryHandler {
  public readonly connection: PostgreSQLConnection;
  public error: Error | null = null;
  private readonly pool: PostgreSQLPool;
  private readonly leaseKind: LeaseKind;
  private readonly lost: Deferred<void> = new Deferred<void>();
  private chain: Promise<void> = Promise.resolve();
  private isReleased: boolean = false;

  public constructor(pool: PostgreSQLPool, connection: PostgreSQLConnection, kind: LeaseKind) {
    super();
    this.pool = pool;
    this.connection = connection;
    this.leaseKind = kind;
    this.lost.promise.catch(() => undefined);
  }

  public override get kind(): LeaseKind {
    return this.leaseKind;
  }

  public get options(): ClientOptions {
    return this.pool.options;
  }

  public get closed(): Promise<void> {
    return this.lost.promise;
  }

  public get released(): boolean {
    return this.isReleased;
  }

  public handle(query: Query): void {
    this.send(query);
  }

  public cancelAsync(query: Query): Promise<void> {
    return this.pool.cancelAsync(query);
  }

  public send(query: Query): void {
    const closed = this.connection.closed;
    if (!Object.isNull(closed)) {
      query.reject(closed);
      return;
    }

    if (this.isReleased) {
      query.reject(this.createEndedError());
      return;
    }

    this.chain = this.chain.then(() => new Promise<void>(resolve => {
      query.onwrite = (): void => resolve();
      query.promise.then(() => resolve(), () => resolve());
      this.pool.query(query, this);
    }));
  }

  public release(): void {
    if (this.isReleased)
      return;

    this.isReleased = true;
    if (this.connection.lease === this)
      this.connection.lease = null;
    if (!Object.isNull(this.connection.closed))
      return;

    if (this.connection.inflight > 0) {
      this.connection.releasing = true;
      return;
    }

    if (this.connection.status === TransactionStatus.Idle)
      this.pool.onReady(this.connection);
    else
      this.connection.closeAsync();
  }

  public createEndedError(): UnsafeTransactionException {
    return new UnsafeTransactionException(Resources.formatLeaseEnded(this.leaseKind));
  }

  public override onClose(error: Error): void {
    this.error = error;
    this.lost.reject(error);
  }
}
