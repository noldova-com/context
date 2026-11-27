/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ChangeOperation, DataException, DataRecord, DataSource, Migrator } from "@noldova/context.data";
import { SqlChangeFeed, SqlMigrator } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { CheckingDialect } from "../fixtures/checking-dialect.fixture.js";
import { NotesMigration } from "../fixtures/notes-migration.fixture.js";
import { RecordingConnection } from "../fixtures/recording-connection.fixture.js";
import { RecordingSession } from "../fixtures/recording-session.fixture.js";

@TestClass
export class SqlMigratorTests {
  @TestMethod
  public async createsEveryTableOnlyUnderTheLockInATransaction(): Promise<void> {
    const connection = new RecordingConnection();
    const feed = new SqlChangeFeed(connection);

    await new SqlMigrator(connection, [new NotesMigration()]).migrateAsync();
    await feed.readAfterAsync(0);
    await feed.appendAsync("note", "a", ChangeOperation.Insert, "{}");

    let locked = false;
    const unlocked: string[] = [];
    for (const statement of connection.statements) {
      if (statement === "BEGIN" || statement === "COMMIT")
        locked = false;
      else if (statement.startsWith("LOCK"))
        locked = true;
      else if (statement.startsWith("CREATE") && !locked)
        unlocked.push(statement);
    }
    Assert.areEqual(8, connection.statements.filter(t => t.startsWith("CREATE")).length);
    Assert.areEqual(String.empty, unlocked.join("|"));
  }

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
    Assert.areEqual("BEGIN", connection.statements[0]);
    Assert.areEqual("LOCK __migrations", connection.statements[1]);
    Assert.areEqual("COMMIT", connection.statements[4]);
    Assert.areEqual("BEGIN", connection.statements[5]);
    Assert.areEqual("LOCK __migrations", connection.statements[6]);
    Assert.isTrue(connection.statements[7]?.startsWith("CREATE TABLE IF NOT EXISTS \"__migrations\"") === true);
    Assert.isTrue(connection.statements[8]?.startsWith("SELECT \"id\" FROM \"__migrations\"") === true);
    Assert.areEqual("CREATE TABLE \"notes\" (\"id\" TEXT NOT NULL, \"text\" TEXT NOT NULL, CONSTRAINT \"PK_notes\" PRIMARY KEY (\"id\"))", connection.statements[9]);
    Assert.areEqual("CREATE INDEX \"IX_notes_text\" ON \"notes\" (\"text\")", connection.statements[10]);
    Assert.isTrue(connection.statements[11]?.startsWith("INSERT INTO \"__migrations\"") === true);
    Assert.areEqual("COMMIT", connection.statements[12]);
  }

  @TestMethod
  public async skipsAMigrationAnotherProcessRecordedBeforeTheLock(): Promise<void> {
    const connection = new RecordingConnection();
    connection.session.appliedOnLock = "20260908130000_Notes";
    connection.session.locksBeforeApplied = 1;
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
  public async runsTheDialectsStatementsAroundEachMigrationAndChecksItsForeignKeysBeforeItCommits(): Promise<void> {
    const connection = new RecordingConnection(new DataSource("recording", ":memory:"), new RecordingSession(), new CheckingDialect());

    await new SqlMigrator(connection, [new NotesMigration()]).migrateAsync();

    const migration = connection.statements.slice(connection.statements.indexOf("CHECKS OFF"));
    Assert.areEqual("CHECKS OFF", migration[0]);
    Assert.areEqual("BEGIN", migration[1]);
    Assert.areEqual("SELECT VIOLATION", migration[migration.length - 4]);
    Assert.isTrue(migration[migration.length - 3]?.startsWith("INSERT INTO \"__migrations\"") === true);
    Assert.areEqual("COMMIT", migration[migration.length - 2]);
    Assert.areEqual("CHECKS ON", migration[migration.length - 1]);
  }

  @TestMethod
  public async rollsBackAMigrationThatLeavesARowBreakingAForeignKey(): Promise<void> {
    const session = new RecordingSession();
    const connection = new RecordingConnection(new DataSource("recording", ":memory:"), session, new CheckingDialect());
    session.queryResults.push(new DataRecord(new Map([["table", "notes"], ["parent", "owners"]])));

    const exception = await Assert.throwsAsync(async () => new SqlMigrator(connection, [new NotesMigration()]).migrateAsync(), DataException);

    Assert.areEqual("The migration \"20260908130000_Notes\" leaves rows in \"notes\" that refer to no row of \"owners\".", exception.message);
    Assert.areEqual("ROLLBACK", connection.statements[connection.statements.length - 2]);
    Assert.areEqual("CHECKS ON", connection.statements[connection.statements.length - 1]);
  }

  @TestMethod
  public requiresUniqueAscendingIds(): void {
    Assert.throws(() => new SqlMigrator(new RecordingConnection(), [new NotesMigration(), new NotesMigration()]), DataException);
  }
}
