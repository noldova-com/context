/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Connection, type DataRecord, type DataSource } from "@noldova/context.data";

import { SqlQuery } from "./sql-query.js";
import type { SqlDialect } from "../services/sql-dialect.js";
import type { SqlSession } from "./sql-session.js";
import { SqlTransaction } from "./sql-transaction.js";

export abstract class SqlConnection extends Connection<SqlTransaction> {
  private readonly session: SqlSession;

  protected constructor(dataSource: DataSource, session: SqlSession) {
    super(dataSource);

    this.session = session;
  }

  public abstract get dialect(): SqlDialect;

  public override get isOpen(): boolean {
    return this.session.isOpen;
  }

  public async executeAsync(query: SqlQuery): Promise<number> {
    return this.runExclusiveAsync(async () => {
      this.throwIfClosed();
      return this.session.executeAsync(query);
    });
  }

  public async insertAsync(query: SqlQuery): Promise<number> {
    return this.runExclusiveAsync(async () => {
      this.throwIfClosed();
      return this.session.insertAsync(query);
    });
  }

  public async queryAsync(query: SqlQuery): Promise<readonly DataRecord[]> {
    return this.runExclusiveAsync(async () => {
      this.throwIfClosed();
      return this.session.queryAsync(query);
    });
  }

  protected override async beginTransactionCoreAsync(): Promise<SqlTransaction> {
    await this.session.executeAsync(new SqlQuery(this.dialect.formatBeginTransaction()));
    return new SqlTransaction(this.session);
  }

  protected override async closeCoreAsync(): Promise<void> {
    await this.session.closeAsync();
  }
}
