/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DbContext, DbContextOptions, ModelSnapshot } from "@noldova/context.data";
import type { SqlConnection, SqlMigration } from "@noldova/context.data.sql";

import { NotesContextMigrations as FirstPostgreSQLMigrations } from "./projects/notes/v1/migrations/postgresql/notes-context-migrations.js";
import { NotesContextModelSnapshot as FirstPostgreSQLSnapshot } from "./projects/notes/v1/migrations/postgresql/notes-context-model-snapshot.js";
import { NotesContextMigrations as FirstSQLiteMigrations } from "./projects/notes/v1/migrations/sqlite/notes-context-migrations.js";
import { NotesContextModelSnapshot as FirstSQLiteSnapshot } from "./projects/notes/v1/migrations/sqlite/notes-context-model-snapshot.js";
import { NotesContext as FirstContext } from "./projects/notes/v1/notes-context.js";
import { NotesContextMigrations as SecondPostgreSQLMigrations } from "./projects/notes/v2/migrations/postgresql/notes-context-migrations.js";
import { NotesContextModelSnapshot as SecondPostgreSQLSnapshot } from "./projects/notes/v2/migrations/postgresql/notes-context-model-snapshot.js";
import { NotesContextMigrations as SecondSQLiteMigrations } from "./projects/notes/v2/migrations/sqlite/notes-context-migrations.js";
import { NotesContextModelSnapshot as SecondSQLiteSnapshot } from "./projects/notes/v2/migrations/sqlite/notes-context-model-snapshot.js";
import { NotesContext as SecondContext } from "./projects/notes/v2/notes-context.js";
import { NotesContextMigrations as ThirdPostgreSQLMigrations } from "./projects/notes/v3/migrations/postgresql/notes-context-migrations.js";
import { NotesContextModelSnapshot as ThirdPostgreSQLSnapshot } from "./projects/notes/v3/migrations/postgresql/notes-context-model-snapshot.js";
import { NotesContextMigrations as ThirdSQLiteMigrations } from "./projects/notes/v3/migrations/sqlite/notes-context-migrations.js";
import { NotesContextModelSnapshot as ThirdSQLiteSnapshot } from "./projects/notes/v3/migrations/sqlite/notes-context-model-snapshot.js";
import { NotesContext as ThirdContext } from "./projects/notes/v3/notes-context.js";

export type NotesContextClass = new (options: DbContextOptions<SqlConnection, SqlMigration>, migrations: readonly SqlMigration[], snapshot: ModelSnapshot)
  => DbContext<SqlConnection, SqlMigration>;

export type NotesSnapshotClass = new () => ModelSnapshot;

export class NotesStep {
  public static readonly sqlite: string = "sqlite";

  public static readonly all: readonly NotesStep[] = [
    new NotesStep("v1", "AddNotes", "20261127120000-add-notes.ts", "2026-11-27T12:00:00Z", FirstContext, FirstSQLiteMigrations.all, FirstSQLiteSnapshot, FirstPostgreSQLMigrations.all,
      FirstPostgreSQLSnapshot),
    new NotesStep("v2", "AddOwners", "20261127130000-add-owners.ts", "2026-11-27T13:00:00Z", SecondContext, SecondSQLiteMigrations.all, SecondSQLiteSnapshot, SecondPostgreSQLMigrations.all,
      SecondPostgreSQLSnapshot),
    new NotesStep("v3", "ChangeOwnerKey", "20261127140000-change-owner-key.ts", "2026-11-27T14:00:00Z", ThirdContext, ThirdSQLiteMigrations.all, ThirdSQLiteSnapshot, ThirdPostgreSQLMigrations.all,
      ThirdPostgreSQLSnapshot)
  ];

  public readonly version: string;
  public readonly name: string;
  public readonly migrationFile: string;
  public readonly now: Date;

  private readonly contextClass: NotesContextClass;
  private readonly sqliteMigrations: readonly SqlMigration[];
  private readonly sqliteSnapshot: NotesSnapshotClass;
  private readonly postgresqlMigrations: readonly SqlMigration[];
  private readonly postgresqlSnapshot: NotesSnapshotClass;

  private constructor(
    version: string,
    name: string,
    migrationFile: string,
    now: string,
    contextClass: NotesContextClass,
    sqliteMigrations: readonly SqlMigration[],
    sqliteSnapshot: NotesSnapshotClass,
    postgresqlMigrations: readonly SqlMigration[],
    postgresqlSnapshot: NotesSnapshotClass) {
    this.version = version;
    this.name = name;
    this.migrationFile = migrationFile;
    this.now = new Date(now);
    this.contextClass = contextClass;
    this.sqliteMigrations = sqliteMigrations;
    this.sqliteSnapshot = sqliteSnapshot;
    this.postgresqlMigrations = postgresqlMigrations;
    this.postgresqlSnapshot = postgresqlSnapshot;
  }

  public snapshot(provider: string): ModelSnapshot {
    return provider === NotesStep.sqlite ? new this.sqliteSnapshot() : new this.postgresqlSnapshot();
  }

  public open(options: DbContextOptions<SqlConnection, SqlMigration>, provider: string): DbContext<SqlConnection, SqlMigration> {
    return new this.contextClass(options, provider === NotesStep.sqlite ? this.sqliteMigrations : this.postgresqlMigrations, this.snapshot(provider));
  }
}
