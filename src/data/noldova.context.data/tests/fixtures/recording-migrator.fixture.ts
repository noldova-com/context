/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type MigrationHistory, Migrator } from "@noldova/context.data";

import type { MemoryConnection } from "./memory-connection.fixture.js";
import type { NotesMigration } from "./notes-migration.fixture.js";

export class RecordingMigrator extends Migrator<NotesMigration> {
  public readonly applied: string[] = [];
  public readonly connection: MemoryConnection | null;
  public failingId: string | undefined;
  public skippedId: string | undefined = undefined;

  public constructor(migrations: readonly NotesMigration[], history: MigrationHistory, connection: MemoryConnection | null = null) {
    super(migrations, history);

    this.connection = connection;
    this.failingId = undefined;
  }

  protected override async applyAsync(migration: NotesMigration): Promise<boolean> {
    if (migration.id === this.failingId)
      throw new Error(migration.id);
    if (migration.id === this.skippedId)
      return false;

    this.applied.push(migration.id);
    await this.history.recordAsync(migration.id);
    return true;
  }
}
