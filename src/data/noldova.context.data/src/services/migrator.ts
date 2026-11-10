/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Migration } from "../models/migration.js";
import type { MigrationHistory } from "./migration-history.js";

export abstract class Migrator<TMigration extends Migration> {
  private readonly migrations: readonly TMigration[];

  protected readonly history: MigrationHistory;

  protected constructor(migrations: readonly TMigration[], history: MigrationHistory) {
    Migration.validateOrder(migrations);

    this.migrations = [...migrations];
    this.history = history;
  }

  public async migrateAsync(): Promise<readonly string[]> {
    const applied: string[] = [];
    for (const migration of await this.getPendingMigrationsAsync())
      if (await this.applyAsync(migration))
        applied.push(migration.id);

    return applied;
  }

  public async getPendingMigrationsAsync(): Promise<readonly TMigration[]> {
    const applied = new Set(await this.history.getAppliedAsync());
    return this.migrations.filter(t => !applied.has(t.id));
  }

  public async getAppliedMigrationsAsync(): Promise<readonly string[]> {
    return this.history.getAppliedAsync();
  }

  protected abstract applyAsync(migration: TMigration): Promise<boolean>;
}
