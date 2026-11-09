/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type ChangeFeed, DataProvider, type Migrator } from "@noldova/context.data";

import { SqlChangeFeed } from "./sql-change-feed.js";
import type { SqlConnection } from "../models/sql-connection.js";
import type { SqlMigration } from "../models/sql-migration.js";
import type { SqlTransaction } from "../models/sql-transaction.js";
import { SqlMigrator } from "./sql-migrator.js";

export abstract class SqlProvider extends DataProvider<SqlConnection, SqlMigration> {
  public override createMigrator(connection: SqlConnection, migrations: readonly SqlMigration[]): Migrator<SqlMigration> {
    return new SqlMigrator(connection, migrations);
  }

  public override createChangeFeed(connection: SqlConnection): ChangeFeed<SqlTransaction> {
    return new SqlChangeFeed(connection);
  }
}
