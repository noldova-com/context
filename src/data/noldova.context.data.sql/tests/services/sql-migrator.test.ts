/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException, Migrator } from "@noldova/context.data";
import { SqlMigrator } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { NotesMigration } from "../fixtures/notes-migration.fixture.js";
import { RecordingConnection } from "../fixtures/recording-connection.fixture.js";

@TestClass
export class SqlMigratorTests {
  @TestMethod
  public async appliesEachPendingMigrationInOneLockedTransaction(): Promise<void> {
    const connection = new RecordingConnection();
    const migrator = new SqlMigrator(connection, [new NotesMigration()]);

    const applied = await migrator.migrateAsync();
    const appliedAgain = await migrator.migrateAsync();

    Assert.isInstanceOf(migrator, Migrator);
    Assert.areEqual("20260908130000_Notes", applied.join(","));
    Assert.areEqual(0, appliedAgain.length);
    Assert.areEqual("20260908130000_Notes", (await migrator.getAppliedMigrationsAsync()).join(","));
    Assert.areEqual("BEGIN", connection.statements[2]);
    Assert.areEqual("LOCK __migrations", connection.statements[3]);
    Assert.isTrue(connection.statements[4]?.startsWith("CREATE TABLE IF NOT EXISTS \"__migrations\"") === true);
    Assert.isTrue(connection.statements[5]?.startsWith("SELECT \"id\" FROM \"__migrations\"") === true);
    Assert.areEqual("CREATE TABLE \"notes\" (\"id\" TEXT NOT NULL, \"text\" TEXT NOT NULL, PRIMARY KEY (\"id\"))", connection.statements[6]);
    Assert.areEqual("CREATE INDEX \"IX_notes_text\" ON \"notes\" (\"text\")", connection.statements[7]);
    Assert.isTrue(connection.statements[8]?.startsWith("INSERT INTO \"__migrations\"") === true);
    Assert.areEqual("COMMIT", connection.statements[9]);
  }

  @TestMethod
  public async skipsAMigrationAnotherProcessRecordedBeforeTheLock(): Promise<void> {
    const connection = new RecordingConnection();
    connection.session.appliedOnLock = "20260908130000_Notes";
    const migrator = new SqlMigrator(connection, [new NotesMigration()]);

    const applied = await migrator.migrateAsync();

    Assert.areEqual(0, applied.length);
    Assert.isFalse(connection.statements.some(t => t.startsWith("CREATE TABLE \"notes\"")));
    Assert.isFalse(connection.statements.some(t => t.startsWith("INSERT INTO \"__migrations\"")));
    Assert.areEqual("COMMIT", connection.statements[connection.statements.length - 1]);
    Assert.areEqual("20260908130000_Notes", (await migrator.getAppliedMigrationsAsync()).join(","));
  }

  @TestMethod
  public async appliesOnlyTheMigrationsAfterThoseRecorded(): Promise<void> {
    const connection = new RecordingConnection();
    await new SqlMigrator(connection, [new NotesMigration()]).migrateAsync();
    const migrator = new SqlMigrator(connection, [new NotesMigration(), new NotesMigration("20260908140000_Later")]);

    Assert.areEqual("20260908140000_Later", (await migrator.migrateAsync()).join(","));
    Assert.areEqual(2, (await migrator.getAppliedMigrationsAsync()).length);
  }

  @TestMethod
  public async rollsBackAMigrationThatFails(): Promise<void> {
    const connection = new RecordingConnection();
    connection.session.failingStatement = "IX_notes_text";
    const migrator = new SqlMigrator(connection, [new NotesMigration()]);

    await Assert.throwsAsync(async () => migrator.migrateAsync(), Error);
    Assert.areEqual("ROLLBACK", connection.statements[connection.statements.length - 1]);
    Assert.areEqual(0, (await migrator.getAppliedMigrationsAsync()).length);
  }

  @TestMethod
  public requiresUniqueAscendingIds(): void {
    Assert.throws(() => new SqlMigrator(new RecordingConnection(), [new NotesMigration(), new NotesMigration()]), DataException);
  }
}
