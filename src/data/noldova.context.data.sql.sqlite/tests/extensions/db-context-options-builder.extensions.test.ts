/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { existsSync } from "node:fs";

import { DbContextOptions, DbContextOptionsBuilder } from "@noldova/context.data";
import { SqlQuery } from "@noldova/context.data.sql";
import { SQLiteProvider } from "@noldova/context.data.sql.sqlite";
import { ArgumentException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { NotesContext } from "../fixtures/notes-context.fixture.js";
import { TemporaryDirectory } from "../fixtures/temporary-directory.fixture.js";

@TestClass
export class DbContextOptionsBuilderExtensionsTests {
  @TestMethod
  public buildsOptionsForASQLiteFile(): void {
    using directory = new TemporaryDirectory();
    const location = directory.location("app");

    const options = new DbContextOptionsBuilder().useSQLite(location);

    Assert.isInstanceOf(options, DbContextOptions);
    Assert.isInstanceOf(options.provider, SQLiteProvider);
    Assert.areEqual("app", options.dataSource.name);
    Assert.areEqual(location, options.dataSource.location);
  }

  @TestMethod
  public namesTheDataSourceAfterTheFile(): void {
    Assert.areEqual("app", new DbContextOptionsBuilder().useSQLite("/data/app.db").dataSource.name);
    Assert.areEqual(":memory:", new DbContextOptionsBuilder().useSQLite(":memory:").dataSource.name);
  }

  @TestMethod
  public rejectsABlankLocation(): void {
    Assert.areEqual("location", Assert.throws(() => new DbContextOptionsBuilder().useSQLite(" "), ArgumentException).parameterName);
  }

  @TestMethod
  public async opensAContextThatMigratesTheFile(): Promise<void> {
    using directory = new TemporaryDirectory();
    const location = directory.location("notes");
    await using context = new NotesContext(new DbContextOptionsBuilder().useSQLite(location));

    Assert.areEqual("20260908130000_Notes", (await context.database.migrateAsync()).join(","));
    Assert.isTrue(existsSync(location));
    const names = await context.database.connection.queryAsync(new SqlQuery("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'IX_notes_text'"));
    Assert.areEqual(1, names.length);
  }
}
