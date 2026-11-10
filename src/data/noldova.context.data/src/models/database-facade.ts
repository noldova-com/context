/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DbContextOptions } from "./db-context-options.js";
import { Migration } from "./migration.js";
import type { ChangeFeed } from "../services/change-feed.js";
import type { Connection } from "./connection.js";
import type { Migrator } from "../services/migrator.js";

export class DatabaseFacade<TConnection extends Connection, TMigration extends Migration> {
  private readonly migrator: Migrator<TMigration>;

  public readonly connection: TConnection;
  public readonly changeFeed: ChangeFeed;

  public constructor(options: DbContextOptions<TConnection, TMigration>, migrations: readonly TMigration[]) {
    Migration.validateOrder(migrations);
    this.connection = options.provider.openConnection(options.dataSource);
    this.migrator = options.provider.createMigrator(this.connection, migrations);
    this.changeFeed = options.provider.createChangeFeed(this.connection);
  }

  public async migrateAsync(): Promise<readonly string[]> {
    return this.migrator.migrateAsync();
  }

  public async getAppliedMigrationsAsync(): Promise<readonly string[]> {
    return this.migrator.getAppliedMigrationsAsync();
  }

  public async getPendingMigrationsAsync(): Promise<readonly TMigration[]> {
    return this.migrator.getPendingMigrationsAsync();
  }
}
