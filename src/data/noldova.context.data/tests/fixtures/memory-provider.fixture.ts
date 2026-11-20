/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type ChangeFeed, DataProvider, type DataSource, type Migrator } from "@noldova/context.data";

import { MemoryChangeFeed } from "./memory-change-feed.fixture.js";
import { MemoryConnection } from "./memory-connection.fixture.js";
import { MemoryMigrationHistory } from "./memory-migration-history.fixture.js";
import type { NotesMigration } from "./notes-migration.fixture.js";
import { RecordingMigrator } from "./recording-migrator.fixture.js";

export class MemoryProvider extends DataProvider<MemoryConnection, NotesMigration> {
  public readonly history: MemoryMigrationHistory = new MemoryMigrationHistory();
  public readonly connections: MemoryConnection[] = [];
  public readonly changeFeeds: MemoryChangeFeed[] = [];
  public migratorFailure: Error | undefined = undefined;
  public changeFeedFailure: Error | undefined = undefined;
  public closeFailure: Error | undefined = undefined;

  public override openConnection(dataSource: DataSource): MemoryConnection {
    const connection = new MemoryConnection(dataSource);
    connection.closeFailure = this.closeFailure;
    this.connections.push(connection);
    return connection;
  }

  public override createMigrator(connection: MemoryConnection, migrations: readonly NotesMigration[]): Migrator<NotesMigration> {
    if (!Object.isUndefined(this.migratorFailure))
      throw this.migratorFailure;

    return new RecordingMigrator(migrations, this.history, connection);
  }

  public override createChangeFeed(_connection: MemoryConnection): ChangeFeed {
    if (!Object.isUndefined(this.changeFeedFailure))
      throw this.changeFeedFailure;

    const changeFeed = new MemoryChangeFeed();
    this.changeFeeds.push(changeFeed);
    return changeFeed;
  }
}
