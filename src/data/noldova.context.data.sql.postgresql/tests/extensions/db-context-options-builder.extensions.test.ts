/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { setImmediate } from "node:timers";

import { ChangeOperation, DataException, DbContextOptions, DbContextOptionsBuilder } from "@noldova/context.data";
import { SqlQuery } from "@noldova/context.data.sql";
import { PostgreSQLProvider } from "@noldova/context.data.sql.postgresql";
import { ArgumentException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { NotesContext } from "../fixtures/notes-context.fixture.js";
import { RealClient } from "../fixtures/real-client.fixture.js";
import { TemporarySchema } from "../fixtures/temporary-schema.fixture.js";

@TestClass
export class DbContextOptionsBuilderExtensionsTests {
  private static readonly countLockWaits: string = "SELECT count(*)::int AS waiting FROM pg_locks WHERE locktype = 'advisory' AND NOT granted";

  @TestMethod
  public buildsOptionsForAPostgreSQLDatabase(): void {
    const location = "postgres://user@db.example:5432/notes";

    const options = new DbContextOptionsBuilder().usePostgreSQL(location);

    Assert.isInstanceOf(options, DbContextOptions);
    Assert.isInstanceOf(options.provider, PostgreSQLProvider);
    Assert.areEqual("notes", options.dataSource.name);
    Assert.areEqual(location, options.dataSource.location);
  }

  @TestMethod
  public namesTheDataSourceAfterTheUserWhenNoDatabaseIsGiven(): void {
    Assert.areEqual("app", new DbContextOptionsBuilder().usePostgreSQL("postgres://app@db.example").dataSource.name);
  }

  @TestMethod
  public rejectsABlankLocation(): void {
    Assert.areEqual("location", Assert.throws(() => new DbContextOptionsBuilder().usePostgreSQL(" "), ArgumentException).parameterName);
  }

  @TestMethod
  public rejectsALocationThatIsNotAConnectionStringWithoutNamingIt(): void {
    const failure = Assert.throws(() => new DbContextOptionsBuilder().usePostgreSQL("/data/secret-notes.db"), DataException);

    Assert.isFalse(failure.message.includes("secret-notes"));
  }

  @TestMethod
  public async opensAContextThatMigratesTheDatabase(): Promise<void> {
    await using schema = await TemporarySchema.createAsync();
    await using context = new NotesContext(new DbContextOptionsBuilder().usePostgreSQL(schema.location));

    Assert.areEqual("20260908130000_Notes", (await context.database.migrateAsync()).join(","));
    const query = new SqlQuery("SELECT indexname FROM pg_indexes WHERE schemaname = ? AND indexname = 'IX_notes_text'", [schema.name]);
    Assert.areEqual(1, (await context.database.connection.queryAsync(query)).length);
    Assert.areEqual(0, (await context.database.getPendingMigrationsAsync()).length);
    Assert.areEqual(1, (await context.database.changeFeed.appendAsync("note", "a", ChangeOperation.Insert, "{}")).sequence);
    Assert.areEqual(1, (await context.database.changeFeed.readAfterAsync(0)).length);
  }

  @TestMethod
  public async appliesEachMigrationOnceWhenTwoContextsWaitOnTheMigrationLock(): Promise<void> {
    await using schema = await TemporarySchema.createAsync();
    await using first = new NotesContext(new DbContextOptionsBuilder().usePostgreSQL(schema.location));
    await using second = new NotesContext(new DbContextOptionsBuilder().usePostgreSQL(schema.location));
    const holder = RealClient.create({ onnotice: false });

    try {
      const { migrating } = await holder.beginAsync(async scope => {
        await scope.runUnsafe("SELECT pg_advisory_xact_lock(hashtext('__migrations'))");
        let settled = false;
        const both = Promise.all([first.database.migrateAsync(), second.database.migrateAsync()]).finally(() => {
          settled = true;
        });
        both.catch(() => undefined);
        while (!settled && Number(RealClient.field(await scope.runUnsafe(DbContextOptionsBuilderExtensionsTests.countLockWaits), "waiting")) < 2)
          await new Promise<void>(resolve => setImmediate(resolve));
        return { migrating: both };
      });

      Assert.areEqual("20260908130000_Notes", (await migrating).flat().join(","));
      Assert.areEqual("20260908130000_Notes", (await second.database.getAppliedMigrationsAsync()).join(","));
    }
    finally {
      await holder.endAsync();
    }
  }
}
