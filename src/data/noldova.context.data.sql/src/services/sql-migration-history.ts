/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { MigrationHistory } from "@noldova/context.data";

import { SqlQuery } from "../models/sql-query.js";
import { Resources } from "../resources.js";
import type { SqlConnection } from "../models/sql-connection.js";
import type { SqlTransaction } from "../models/sql-transaction.js";

export class SqlMigrationHistory extends MigrationHistory {
  private readonly connection: SqlConnection;

  public constructor(connection: SqlConnection) {
    super();

    this.connection = connection;
  }

  public override async getAppliedAsync(transaction?: SqlTransaction): Promise<readonly string[]> {
    if (Object.isUndefined(transaction))
      return this.connection.runInTransactionAsync(async t => {
        for (const statement of this.connection.dialect.formatLock(Resources.migrationsTable))
          await t.executeAsync(new SqlQuery(statement));
        return this.getAppliedAsync(t);
      });

    await transaction.executeAsync(new SqlQuery(Resources.createMigrationsTable));
    return (await transaction.queryAsync(new SqlQuery(Resources.selectAppliedMigrations))).map(t => t.readString(Resources.idColumn));
  }

  public override async recordAsync(id: string, transaction?: SqlTransaction): Promise<void> {
    await (transaction ?? this.connection).executeAsync(new SqlQuery(Resources.insertMigration, [id, new Date().toISOString()]));
  }
}
