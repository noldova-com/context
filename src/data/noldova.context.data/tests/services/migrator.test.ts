/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { MemoryMigrationHistory } from "../fixtures/memory-migration-history.fixture.js";
import { NotesMigration } from "../fixtures/notes-migration.fixture.js";
import { RecordingMigrator } from "../fixtures/recording-migrator.fixture.js";

@TestClass
export class MigratorTests {
  @TestMethod
  public async appliesPendingMigrationsOnceInOrder(): Promise<void> {
    const history = new MemoryMigrationHistory();
    const migrator = new RecordingMigrator([new NotesMigration("20260908130000_A"), new NotesMigration("20260908130001_B")], history);

    const applied = await migrator.migrateAsync();
    const appliedAgain = await migrator.migrateAsync();

    Assert.areEqual("20260908130000_A,20260908130001_B", applied.join(","));
    Assert.areEqual(0, appliedAgain.length);
    Assert.areEqual("20260908130000_A,20260908130001_B", (await migrator.getAppliedMigrationsAsync()).join(","));
    Assert.areEqual(0, (await migrator.getPendingMigrationsAsync()).length);
  }

  @TestMethod
  public async appliesOnlyWhatTheHistoryDoesNotRecord(): Promise<void> {
    const history = new MemoryMigrationHistory();
    await history.recordAsync("20260908130000_A");
    const migrator = new RecordingMigrator([new NotesMigration("20260908130000_A"), new NotesMigration("20260908130001_B")], history);

    Assert.areEqual("20260908130001_B", (await migrator.getPendingMigrationsAsync()).map(t => t.id).join(","));
    Assert.areEqual("20260908130001_B", (await migrator.migrateAsync()).join(","));
    Assert.areEqual("20260908130001_B", migrator.applied.join(","));
  }

  @TestMethod
  public async returnsOnlyTheMigrationsThisCallApplied(): Promise<void> {
    const migrator = new RecordingMigrator([new NotesMigration("20260908130000_A"), new NotesMigration("20260908130001_B")], new MemoryMigrationHistory());
    migrator.skippedId = "20260908130000_A";

    Assert.areEqual("20260908130001_B", (await migrator.migrateAsync()).join(","));
  }

  @TestMethod
  public async stopsAtTheFirstMigrationThatFails(): Promise<void> {
    const history = new MemoryMigrationHistory();
    const migrator = new RecordingMigrator([new NotesMigration("20260908130000_A"), new NotesMigration("20260908130001_B")], history);
    migrator.failingId = "20260908130000_A";

    await Assert.throwsAsync(async () => migrator.migrateAsync(), Error);
    Assert.areEqual(0, (await migrator.getAppliedMigrationsAsync()).length);
    Assert.areEqual(2, (await migrator.getPendingMigrationsAsync()).length);
  }

  @TestMethod
  public requiresUniqueAscendingIds(): void {
    Assert.throws(() => new RecordingMigrator([new NotesMigration(), new NotesMigration()], new MemoryMigrationHistory()), DataException);
    Assert.doesNotThrow(() => new RecordingMigrator([], new MemoryMigrationHistory()));
  }
}
