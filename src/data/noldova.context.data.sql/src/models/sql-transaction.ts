/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type DataRecord, Transaction } from "@noldova/context.data";

import { SqlQuery } from "./sql-query.js";
import { Resources } from "../resources.js";
import type { SqlSession } from "./sql-session.js";

export class SqlTransaction extends Transaction {
  private readonly session: SqlSession;

  public constructor(session: SqlSession) {
    super();

    this.session = session;
  }

  public async executeAsync(query: SqlQuery): Promise<number> {
    this.throwIfCompleted();
    return this.session.executeAsync(query);
  }

  public async insertAsync(query: SqlQuery): Promise<number> {
    this.throwIfCompleted();
    return this.session.insertAsync(query);
  }

  public async queryAsync(query: SqlQuery): Promise<readonly DataRecord[]> {
    this.throwIfCompleted();
    return this.session.queryAsync(query);
  }

  protected override async commitCoreAsync(): Promise<void> {
    await this.session.executeAsync(new SqlQuery(Resources.commitTransaction));
  }

  protected override async rollbackCoreAsync(): Promise<void> {
    await this.session.executeAsync(new SqlQuery(Resources.rollbackTransaction));
  }
}
