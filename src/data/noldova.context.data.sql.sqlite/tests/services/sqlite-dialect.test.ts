/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PropertyType } from "@noldova/context.data";
import { Column, DropColumnOperation, SqlQuery, SqlStatementOperation } from "@noldova/context.data.sql";
import { SQLiteConnection, SQLiteDialect } from "@noldova/context.data.sql.sqlite";
import { InvalidOperationException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TemporaryDirectory } from "../fixtures/temporary-directory.fixture.js";

@TestClass
export class SQLiteDialectTests {
  @TestMethod
  public spellsTransactionsColumnTypesKeysAndLocks(): void {
    const dialect = new SQLiteDialect();

    Assert.areEqual("BEGIN IMMEDIATE", dialect.formatBeginTransaction());
    Assert.areEqual("TEXT", dialect.formatColumnType(PropertyType.String));
    Assert.areEqual("INTEGER", dialect.formatColumnType(PropertyType.Integer));
    Assert.areEqual("INTEGER PRIMARY KEY AUTOINCREMENT", dialect.formatIdentityColumnType());
    Assert.areEqual(0, dialect.formatLock().length);
  }

  @TestMethod
  public turnsForeignKeysOffAroundAMigrationAndChecksThemBeforeItCommits(): void {
    const dialect = new SQLiteDialect();

    Assert.areEqual("PRAGMA foreign_keys = OFF", dialect.formatMigrationStart().join(";"));
    Assert.areEqual("PRAGMA foreign_keys = ON", dialect.formatMigrationEnd().join(";"));
    Assert.areEqual("SELECT \"table\", \"parent\" FROM pragma_foreign_key_check LIMIT 1", dialect.formatForeignKeyCheck());
  }

  @TestMethod
  public cannotAlterAColumnInPlace(): void {
    const exception = Assert.throws(() => new SQLiteDialect().renderAlterColumn("notes", new Column("title", "TEXT", true)), InvalidOperationException);

    Assert.areEqual("SQLite can't alter the column \"notes.title\" in place; the migrator rebuilds the table instead.", exception.message);
  }

  @TestMethod
  public async runsAStatementAndRebuildsATableForAChangeAsync(): Promise<void> {
    using directory = new TemporaryDirectory();
    await using connection = SQLiteConnection.open(directory.dataSource("app"));
    const dialect = new SQLiteDialect();

    await connection.runInTransactionAsync(async transaction => {
      await dialect.applyAsync(new SqlStatementOperation("CREATE TABLE \"notes\" (\"id\" TEXT NOT NULL, \"text\" TEXT)"), transaction);
      await dialect.applyAsync(new DropColumnOperation("notes", "text"), transaction);
    });

    const columns = await connection.queryAsync(new SqlQuery("SELECT \"name\" FROM pragma_table_info('notes')"));
    Assert.areEqual("id", columns.map(t => t.readString("name")).join(","));
  }
}
