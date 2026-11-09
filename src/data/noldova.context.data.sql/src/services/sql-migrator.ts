/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Migrator } from "@noldova/context.data";

import { SqlQuery } from "../models/sql-query.js";
import { Resources } from "../resources.js";
import { MigrationBuilder } from "../models/schema/migration-builder.js";
import type { SqlConnection } from "../models/sql-connection.js";
import { SqlMigrationHistory } from "./sql-migration-history.js";
import type { SqlMigration } from "../models/sql-migration.js";

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
    return this.connection.runInTransactionAsync(async transaction => {
      for (const statement of this.connection.dialect.formatLock(Resources.migrationsTable))
        await transaction.executeAsync(new SqlQuery(statement));
      if ((await this.sqlHistory.getAppliedAsync(transaction)).includes(migration.id))
        return false;

      for (const operation of builder.toOperations())
        await transaction.executeAsync(new SqlQuery(operation.render(this.connection.dialect)));
      await this.sqlHistory.recordAsync(migration.id, transaction);
      return true;
    });
  }
}
