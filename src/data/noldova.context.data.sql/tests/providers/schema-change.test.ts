/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { type SqlConnection, SqlQuery } from "@noldova/context.data.sql";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ProviderDatabase } from "../fixtures/provider-database.fixture.js";
import { ShapeContext } from "../fixtures/shape-context.fixture.js";
import { ShapeMigration } from "../fixtures/shape-migration.fixture.js";

@TestClass
export class SchemaChangeTests {
  private static readonly created: ShapeMigration = new ShapeMigration("20261127130000_Notes", t => {
    t.createTable("owners", c => {
      c.addColumn("id", "TEXT");
      c.addColumn("name", "TEXT").makeNullable();
    }, c => c.addPrimaryKey("id"));
    t.createTable("notes", c => {
      c.addColumn("id", "TEXT");
      c.addColumn("title", "TEXT");
      c.addColumn("rank", "TEXT").makeNullable();
      c.addColumn("text", "TEXT");
      c.addColumn("ownerId", "TEXT");
    }, c => c.addPrimaryKey("id"));
    t.createTable("tags", c => {
      c.addColumn("id", "TEXT");
      c.addColumn("noteId", "TEXT");
    }, c => {
      c.addPrimaryKey("id");
      c.addForeignKey("noteId", "notes", "id");
    });
    t.createTable("drafts", c => {
      c.addColumn("id", "TEXT");
      c.addColumn("noteId", "TEXT");
    }, c => {
      c.addPrimaryKey("id");
      c.addForeignKey("noteId", "notes", "id");
    });
    t.createIndex<{ title: string }>("notes", n => n.title);
    t.createIndex<{ text: string }>("notes", n => n.text);
    t.executeSql("INSERT INTO \"owners\" (\"id\", \"name\") VALUES ('o1', 'one')");
    t.executeSql("INSERT INTO \"notes\" (\"id\", \"title\", \"rank\", \"text\", \"ownerId\") VALUES ('1', 'first', '7', 'a', 'o1'), ('2', 'second', NULL, 'b', 'nobody')");
    t.executeSql("INSERT INTO \"tags\" (\"id\", \"noteId\") VALUES ('t1', '1')");
    t.executeSql("INSERT INTO \"drafts\" (\"id\", \"noteId\") VALUES ('d1', '2')");
  });

  @TestMethod
  @TestData("sqlite")
  @TestData("postgresql")
  public async changesExistingTablesKeepingTheirRows(provider: string): Promise<void> {
    await using database = await ProviderDatabase.createAsync(provider);
    const integer = provider === ProviderDatabase.sqlite ? "INTEGER" : "BIGINT";
    await using context = new ShapeContext(database.options(), [SchemaChangeTests.created, new ShapeMigration("20261127130001_Change", t => {
      t.dropForeignKey("tags", "noteId");
      t.dropTable("drafts");
      t.dropPrimaryKey("notes");
      t.dropColumn("notes", "text");
      t.alterColumn("notes", "title", "TEXT").makeNullable();
      t.alterColumn("notes", "rank", integer).makeNullable();
      t.alterColumn("owners", "name", "TEXT");
      t.addColumn("notes", "body", "TEXT").hasDefaultValue("none");
      t.addColumn("notes", "editorId", "TEXT").makeNullable();
      t.addPrimaryKey("notes", "id", "ownerId");
      t.addForeignKey("notes", "editorId", "owners", "id");
    })]);

    Assert.areEqual("20261127130000_Notes,20261127130001_Change", (await context.database.migrateAsync()).join(","));
    const connection = context.database.connection;

    Assert.areEqual(`body TEXT NOT NULL, editorId TEXT, id TEXT NOT NULL, ownerId TEXT NOT NULL, rank ${integer}, title TEXT; key id, ownerId; references editorId>owners.id`,
      await database.describeAsync(connection, "notes"));
    Assert.areEqual("id TEXT NOT NULL, name TEXT NOT NULL; key id; references ", await database.describeAsync(connection, "owners"));
    Assert.areEqual("id TEXT NOT NULL, noteId TEXT NOT NULL; key id; references ", await database.describeAsync(connection, "tags"));
    Assert.areEqual("; key ; references ", await database.describeAsync(connection, "drafts"));
    Assert.areEqual("1:first:7:o1:none,2:second:null:nobody:none", await SchemaChangeTests.notesAsync(connection));
    Assert.areEqual(1, (await connection.queryAsync(database.findIndex("IX_notes_title"))).length);
    Assert.areEqual(0, (await connection.queryAsync(database.findIndex("IX_notes_text"))).length);
    await Assert.throwsAsync(async () => connection.executeAsync(
      new SqlQuery("INSERT INTO \"notes\" (\"id\", \"ownerId\", \"editorId\") VALUES ('3', 'o1', 'nobody')")), Error);
    Assert.areEqual(1, await connection.executeAsync(new SqlQuery("INSERT INTO \"tags\" (\"id\", \"noteId\") VALUES ('t2', 'none')")));
  }

  @TestMethod
  @TestData("sqlite")
  @TestData("postgresql")
  public async fillsTheRowsThatHoldNoValueOfAColumnMadeRequiredWithItsDefault(provider: string): Promise<void> {
    await using database = await ProviderDatabase.createAsync(provider);
    await using context = new ShapeContext(database.options(), [new ShapeMigration("20261127140000_Notes", t => {
      t.createTable("notes", c => {
        c.addColumn("id", "TEXT");
        c.addColumn("title", "TEXT").makeNullable();
      }, c => c.addPrimaryKey("id"));
      t.executeSql("INSERT INTO \"notes\" (\"id\", \"title\") VALUES ('1', NULL), ('2', 'kept')");
    }), new ShapeMigration("20261127140001_Required", t => {
      t.alterColumn("notes", "title", "TEXT").hasDefaultValueSql("'none'");
    })]);

    await context.database.migrateAsync();
    const connection = context.database.connection;
    const rows = await connection.queryAsync(new SqlQuery("SELECT \"id\", \"title\" FROM \"notes\" ORDER BY \"id\""));

    Assert.areEqual("1:none,2:kept", rows.map(t => `${t.readString("id")}:${t.readString("title")}`).join(","));
    Assert.areEqual("id TEXT NOT NULL, title TEXT NOT NULL; key id; references ", await database.describeAsync(connection, "notes"));
    Assert.areEqual(1, await connection.executeAsync(new SqlQuery("INSERT INTO \"notes\" (\"id\") VALUES ('3')")));
  }

  @TestMethod
  @TestData("sqlite")
  @TestData("postgresql")
  public async rollsBackAChangeThatLeavesARowReferringToNoRow(provider: string): Promise<void> {
    await using database = await ProviderDatabase.createAsync(provider);
    await using context = new ShapeContext(database.options(), [SchemaChangeTests.created, new ShapeMigration("20261127130001_Owner", t => {
      t.dropColumn("notes", "text");
      t.addForeignKey("notes", "ownerId", "owners", "id");
    })]);

    await Assert.throwsAsync(async () => context.database.migrateAsync(), Error);

    const connection = context.database.connection;
    Assert.areEqual("20261127130000_Notes", (await context.database.getAppliedMigrationsAsync()).join(","));
    Assert.areEqual("id TEXT NOT NULL, ownerId TEXT NOT NULL, rank TEXT, text TEXT NOT NULL, title TEXT NOT NULL; key id; references ",
      await database.describeAsync(connection, "notes"));
    Assert.areEqual(1, (await connection.queryAsync(database.findIndex("IX_notes_text"))).length);
  }

  @TestMethod
  public async failsOnPostgreSQLToChangeAKeyThatAForeignKeyRefersTo(): Promise<void> {
    await using database = await ProviderDatabase.createAsync("postgresql");
    await using context = new ShapeContext(database.options(), [new ShapeMigration("20261127150000_Owners", t => {
      t.createTable("owners", c => c.addColumn("id", "TEXT"), c => c.addPrimaryKey("id"));
      t.addColumn("owners", "code", "TEXT").hasDefaultValueSql("''");
      t.createTable("notes", c => {
        c.addColumn("id", "TEXT");
        c.addColumn("ownerId", "TEXT");
      }, c => c.addPrimaryKey("id"));
      t.addForeignKey("notes", "ownerId", "owners", "id");
    }), new ShapeMigration("20261127150001_OwnerKey", t => {
      t.dropPrimaryKey("owners");
      t.addPrimaryKey("owners", "id", "code");
    })]);

    const exception = await Assert.throwsAsync(async () => context.database.migrateAsync(), Error);

    Assert.areEqual("cannot drop constraint PK_owners on table owners because other objects depend on it", exception.message);
    Assert.areEqual("20261127150000_Owners", (await context.database.getAppliedMigrationsAsync()).join(","));
  }

  private static async notesAsync(connection: SqlConnection): Promise<string> {
    const rows = await connection.queryAsync(new SqlQuery("SELECT \"id\", \"title\", \"rank\", \"ownerId\", \"body\" FROM \"notes\" ORDER BY \"id\""));

    return rows.map(t => [t.readString("id"), t.readString("title"), String(t.readValue("rank")), t.readString("ownerId"), t.readString("body")].join(":")).join(",");
  }
}
