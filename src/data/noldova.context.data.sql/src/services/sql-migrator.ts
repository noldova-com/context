/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { DataException, Migrator } from "@noldova/context.data";

import { SqlQuery } from "../models/sql-query.js";
import { Resources } from "../resources.js";
import { MigrationBuilder } from "../models/schema/migration-builder.js";
import type { SqlConnection } from "../models/sql-connection.js";
import { SqlMigrationHistory } from "./sql-migration-history.js";
import type { SqlMigration } from "../models/sql-migration.js";
import type { SqlTransaction } from "../models/sql-transaction.js";
import type { SqlDialect } from "./sql-dialect.js";

export class SqlMigrator extends Migrator<SqlMigration> {
  private readonly connection: SqlConnection;
  private readonly sqlHistory: SqlMigrationHistory;

  public constructor(connection: SqlConnection, migrations: readonly SqlMigration[]) {
    const history = new SqlMigrationHistory(connection);
    super(migrations, history);

    this.connection = connection;
    this.sqlHistory = history;
  }

  protected override async applyAsync(migration: SqlMigration): Promise<boolean> {
    const builder = new MigrationBuilder();
    migration.apply(builder);
    const dialect = this.connection.dialect;
    for (const statement of dialect.formatMigrationStart())
      await this.connection.executeAsync(new SqlQuery(statement));
    try {
      return await this.connection.runInTransactionAsync(async transaction => {
        for (const statement of dialect.formatLock(Resources.migrationsTable))
          await transaction.executeAsync(new SqlQuery(statement));
        if ((await this.sqlHistory.getAppliedAsync(transaction)).includes(migration.id))
          return false;

        for (const operation of builder.toOperations())
          await dialect.applyAsync(operation, transaction);
        await SqlMigrator.checkForeignKeysAsync(migration, dialect, transaction);
        await this.sqlHistory.recordAsync(migration.id, transaction);

        return true;
      });
    }
    finally {
      for (const statement of dialect.formatMigrationEnd())
        await this.connection.executeAsync(new SqlQuery(statement));
    }
  }

  private static async checkForeignKeysAsync(migration: SqlMigration, dialect: SqlDialect, transaction: SqlTransaction): Promise<void> {
    const check = dialect.formatForeignKeyCheck();
    if (Object.isNull(check))
      return;

    const violation = (await transaction.queryAsync(new SqlQuery(check))).at(0);
    if (!Object.isUndefined(violation))
      throw new DataException(Resources.formatForeignKeyViolated(migration.id, violation.readString(Resources.tableField), violation.readString(Resources.parentField)));
  }
}
