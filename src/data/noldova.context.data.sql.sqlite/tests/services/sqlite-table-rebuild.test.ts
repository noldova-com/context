/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";
import { type MigrationBuilder, SqlMigrator, SqlQuery } from "@noldova/context.data.sql";
import { SQLiteConnection } from "@noldova/context.data.sql.sqlite";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { ShapeMigration } from "../fixtures/shape-migration.fixture.js";
import { TemporaryDirectory } from "../fixtures/temporary-directory.fixture.js";

@TestClass
export class SQLiteTableRebuildTests {
  @TestMethod
  public async altersAColumnKeepingRowsDefaultsAndIndexesAsync(): Promise<void> {
    using directory = new TemporaryDirectory();
    await using connection = await SQLiteTableRebuildTests.openAsync(directory);

    await SQLiteTableRebuildTests.migrateAsync(connection, "20261127120001_Alter", t => t.alterColumn("notes", "title", "TEXT").makeNullable());

    Assert.areEqual("id:TEXT:1:null:1,title:TEXT:0:null:0,ownerId:TEXT:1:null:0,body:TEXT:1:'none':0", await SQLiteTableRebuildTests.columnsAsync(connection));
    Assert.areEqual("1:first:o1:x,2:second:o2:none", await SQLiteTableRebuildTests.rowsAsync(connection));
    Assert.areEqual("IX_notes_ownerId,IX_notes_title", await SQLiteTableRebuildTests.indexesAsync(connection));
    Assert.areEqual("notes", await SQLiteTableRebuildTests.tablesAsync(connection));
  }

  @TestMethod
  public async dropsAColumnWithTheIndexesOverItAsync(): Promise<void> {
    using directory = new TemporaryDirectory();
    await using connection = await SQLiteTableRebuildTests.openAsync(directory);

    await SQLiteTableRebuildTests.migrateAsync(connection, "20261127120001_Drop", t => t.dropColumn("notes", "title"));

    Assert.areEqual("id:TEXT:1:null:1,ownerId:TEXT:1:null:0,body:TEXT:1:'none':0", await SQLiteTableRebuildTests.columnsAsync(connection));
    Assert.areEqual("IX_notes_ownerId", await SQLiteTableRebuildTests.indexesAsync(connection));
  }

  @TestMethod
  public async changesTheKeyAndTheForeignKeysThenEnforcesThemAsync(): Promise<void> {
    using directory = new TemporaryDirectory();
    await using connection = await SQLiteTableRebuildTests.openAsync(directory);

    await SQLiteTableRebuildTests.migrateAsync(connection, "20261127120001_Keys", t => {
      t.dropPrimaryKey("notes");
      t.addPrimaryKey("notes", "id", "ownerId");
      t.addForeignKey("notes", "ownerId", "owners", "id");
    });

    Assert.areEqual("id:TEXT:1:null:1,title:TEXT:1:null:0,ownerId:TEXT:1:null:2,body:TEXT:1:'none':0", await SQLiteTableRebuildTests.columnsAsync(connection));
    Assert.areEqual("ownerId>owners.id", await SQLiteTableRebuildTests.foreignKeysAsync(connection));
    const failure = await Assert.throwsAsync(
      async () => connection.executeAsync(new SqlQuery("INSERT INTO \"notes\" (\"id\", \"title\", \"ownerId\") VALUES ('3', 't', 'nobody')")), Error);
    Assert.areEqual("FOREIGN KEY constraint failed", failure.message);

    await SQLiteTableRebuildTests.migrateAsync(connection, "20261127120002_Unlink", t => t.dropForeignKey("notes", "ownerId"));

    Assert.areEqual("", await SQLiteTableRebuildTests.foreignKeysAsync(connection));
    Assert.areEqual(1, await connection.executeAsync(new SqlQuery("INSERT INTO \"notes\" (\"id\", \"title\", \"ownerId\") VALUES ('3', 't', 'nobody')")));
  }

  @TestMethod
  public async rebuildsAPrincipalLeavingItsDependentsReferringToItAsync(): Promise<void> {
    using directory = new TemporaryDirectory();
    await using connection = await SQLiteTableRebuildTests.openAsync(directory);
    await SQLiteTableRebuildTests.migrateAsync(connection, "20261127120001_Link", t => t.addForeignKey("notes", "ownerId", "owners", "id"));

    await SQLiteTableRebuildTests.migrateAsync(connection, "20261127120002_Owners", t => t.alterColumn("owners", "name", "TEXT").makeNullable());

    Assert.areEqual("ownerId>owners.id", await SQLiteTableRebuildTests.foreignKeysAsync(connection));
    Assert.areEqual("o1,o2", (await connection.queryAsync(new SqlQuery("SELECT \"id\" FROM \"owners\" ORDER BY \"id\""))).map(t => t.readString("id")).join(","));
    const failure = await Assert.throwsAsync(async () => connection.executeAsync(new SqlQuery("DELETE FROM \"owners\" WHERE \"id\" = 'o1'")), Error);
    Assert.areEqual("FOREIGN KEY constraint failed", failure.message);
  }

  @TestMethod
  public async rollsBackAMigrationThatLeavesARowBreakingAForeignKeyAsync(): Promise<void> {
    using directory = new TemporaryDirectory();
    await using connection = await SQLiteTableRebuildTests.openAsync(directory);
    await connection.executeAsync(new SqlQuery("INSERT INTO \"notes\" (\"id\", \"title\", \"ownerId\") VALUES ('3', 'third', 'nobody')"));

    const exception = await Assert.throwsAsync(
      async () => SQLiteTableRebuildTests.migrateAsync(connection, "20261127120001_Link", t => t.addForeignKey("notes", "ownerId", "owners", "id")), DataException);

    Assert.areEqual("The migration \"20261127120001_Link\" leaves rows in \"notes\" that refer to no row of \"owners\".", exception.message);
    Assert.areEqual("", await SQLiteTableRebuildTests.foreignKeysAsync(connection));
    Assert.areEqual("notes", await SQLiteTableRebuildTests.tablesAsync(connection));
    Assert.areEqual(1, (await connection.queryAsync(new SqlQuery("PRAGMA foreign_keys"))).at(0)?.readInteger("foreign_keys"));
  }

  private static async openAsync(directory: TemporaryDirectory): Promise<SQLiteConnection> {
    const connection = SQLiteConnection.open(directory.dataSource("app"));
    await SQLiteTableRebuildTests.migrateAsync(connection, "20261127120000_Notes", t => {
      t.createTable("owners", c => {
        c.addColumn("id", "TEXT");
        c.addColumn("name", "TEXT");
      }, c => c.addPrimaryKey("id"));
      t.createTable("notes", c => {
        c.addColumn("id", "TEXT");
        c.addColumn("title", "TEXT");
        c.addColumn("ownerId", "TEXT");
      }, c => c.addPrimaryKey("id"));
      t.addColumn("notes", "body", "TEXT").hasDefaultValue("none");
      t.createIndex<{ title: string }>("notes", n => n.title);
      t.createIndex<{ ownerId: string }>("notes", n => n.ownerId);
      t.executeSql("INSERT INTO \"owners\" (\"id\", \"name\") VALUES ('o1', 'one'), ('o2', 'two')");
      t.executeSql("INSERT INTO \"notes\" (\"id\", \"title\", \"ownerId\", \"body\") VALUES ('1', 'first', 'o1', 'x')");
      t.executeSql("INSERT INTO \"notes\" (\"id\", \"title\", \"ownerId\") VALUES ('2', 'second', 'o2')");
    });

    return connection;
  }

  private static async migrateAsync(connection: SQLiteConnection, id: string, shape: (builder: MigrationBuilder) => void): Promise<void> {
    const migrations = (await connection.queryAsync(new SqlQuery("SELECT \"name\" FROM sqlite_master WHERE \"name\" = '__migrations'"))).length === 0
      ? []
      : (await connection.queryAsync(new SqlQuery("SELECT \"id\" FROM \"__migrations\" ORDER BY \"id\""))).map(t => new ShapeMigration(t.readString("id"), () => undefined));
    await new SqlMigrator(connection, [...migrations, new ShapeMigration(id, shape)]).migrateAsync();
  }

  private static async columnsAsync(connection: SQLiteConnection): Promise<string> {
    const rows = await connection.queryAsync(new SqlQuery("SELECT \"name\", \"type\", \"notnull\", \"dflt_value\", \"pk\" FROM pragma_table_info('notes') ORDER BY \"cid\""));

    return rows.map(t => `${t.readString("name")}:${t.readString("type")}:${t.readInteger("notnull")}:${t.readNullableString("dflt_value")}:${t.readInteger("pk")}`).join(",");
  }

  private static async rowsAsync(connection: SQLiteConnection): Promise<string> {
    const rows = await connection.queryAsync(new SqlQuery("SELECT \"id\", \"title\", \"ownerId\", \"body\" FROM \"notes\" ORDER BY \"id\""));

    return rows.map(t => `${t.readString("id")}:${t.readString("title")}:${t.readString("ownerId")}:${t.readString("body")}`).join(",");
  }

  private static async indexesAsync(connection: SQLiteConnection): Promise<string> {
    const rows = await connection.queryAsync(new SqlQuery("SELECT \"name\" FROM sqlite_master WHERE \"type\" = 'index' AND \"tbl_name\" = 'notes' AND \"sql\" IS NOT NULL ORDER BY \"name\""));

    return rows.map(t => t.readString("name")).join(",");
  }

  private static async foreignKeysAsync(connection: SQLiteConnection): Promise<string> {
    const rows = await connection.queryAsync(new SqlQuery("SELECT \"from\", \"table\", \"to\" FROM pragma_foreign_key_list('notes')"));

    return rows.map(t => `${t.readString("from")}>${t.readString("table")}.${t.readString("to")}`).join(",");
  }

  private static async tablesAsync(connection: SQLiteConnection): Promise<string> {
    const rows = await connection.queryAsync(new SqlQuery("SELECT \"name\" FROM sqlite_master WHERE \"type\" = 'table' AND (\"name\" = 'notes' OR \"name\" LIKE '%rebuild%') ORDER BY \"name\""));

    return rows.map(t => t.readString("name")).join(",");
  }
}
