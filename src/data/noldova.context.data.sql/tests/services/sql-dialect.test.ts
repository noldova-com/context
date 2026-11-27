/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Index, PropertyType } from "@noldova/context.data";
import { Column, ForeignKey, PrimaryKey, SqlDialect, SqlStatementOperation, SqlTransaction, Table } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RecordingSession } from "../fixtures/recording-session.fixture.js";
import { TestDialect } from "../fixtures/test-dialect.fixture.js";

@TestClass
export class SqlDialectTests {
  private static readonly dialect: SqlDialect = new TestDialect();

  @TestMethod
  public rendersColumnsAndConstraints(): void {
    const dialect = SqlDialectTests.dialect;

    Assert.areEqual("\"name\" TEXT NOT NULL", dialect.renderColumn(new Column("name", "TEXT", false)));
    Assert.areEqual("\"count\" INTEGER NOT NULL", dialect.renderColumn(new Column("count", "INTEGER", false)));
    Assert.areEqual("\"title\" TEXT", dialect.renderColumn(new Column("title", "TEXT", true)));
    Assert.areEqual("\"body\" TEXT NOT NULL DEFAULT ''", dialect.renderColumn(new Column("body", "TEXT", false, "''")));
    Assert.areEqual("CONSTRAINT \"PK_messages\" PRIMARY KEY (\"conversationId\", \"sequence\")",
      dialect.renderPrimaryKey("messages", new PrimaryKey(["conversationId", "sequence"])));
    Assert.areEqual("CONSTRAINT \"FK_notes_projectId\" FOREIGN KEY (\"projectId\") REFERENCES \"projects\" (\"id\")",
      dialect.renderForeignKey("notes", new ForeignKey("projectId", "projects", "id")));
  }

  @TestMethod
  public rendersTablesAndIndexes(): void {
    const dialect = SqlDialectTests.dialect;
    const columns = [new Column("id", "TEXT", false), new Column("projectId", "TEXT", false), new Column("text", "TEXT", true)];
    const notes = new Table("notes", columns, new PrimaryKey(["id"]), [new ForeignKey("projectId", "projects", "id")]);
    const log = new Table("log", [new Column("text", "TEXT", true)], null, []);

    Assert.areEqual(
      "CREATE TABLE \"notes\" (\"id\" TEXT NOT NULL, \"projectId\" TEXT NOT NULL, \"text\" TEXT, CONSTRAINT \"PK_notes\" PRIMARY KEY (\"id\"), " +
      "CONSTRAINT \"FK_notes_projectId\" FOREIGN KEY (\"projectId\") REFERENCES \"projects\" (\"id\"))",
      dialect.renderCreateTable(notes));
    Assert.areEqual("CREATE TABLE \"log\" (\"text\" TEXT)", dialect.renderCreateTable(log));
    Assert.areEqual("CREATE INDEX \"IX_notes_text\" ON \"notes\" (\"text\")", dialect.renderCreateIndex(new Index("IX_notes_text", "notes", ["text"], false)));
    Assert.areEqual(
      "CREATE UNIQUE INDEX \"IX_notes_id_text\" ON \"notes\" (\"id\", \"text\")",
      dialect.renderCreateIndex(new Index("IX_notes_id_text", "notes", ["id", "text"], true)));
  }

  @TestMethod
  public createsATableUnderAnotherNameKeepingItsConstraintNames(): void {
    const notes = new Table("notes", [new Column("id", "TEXT", false)], new PrimaryKey(["id"]), [new ForeignKey("id", "projects", "id")]);

    Assert.areEqual(
      "CREATE TABLE \"__rebuild_notes\" (\"id\" TEXT NOT NULL, CONSTRAINT \"PK_notes\" PRIMARY KEY (\"id\"), " +
      "CONSTRAINT \"FK_notes_id\" FOREIGN KEY (\"id\") REFERENCES \"projects\" (\"id\"))",
      SqlDialectTests.dialect.renderCreateTable(notes, "__rebuild_notes"));
  }

  @TestMethod
  public rendersTheChangesToATable(): void {
    const dialect = SqlDialectTests.dialect;

    Assert.areEqual("DROP TABLE \"notes\"", dialect.renderDropTable("notes"));
    Assert.areEqual("ALTER TABLE \"notes\" ADD COLUMN \"body\" TEXT NOT NULL DEFAULT ''", dialect.renderAddColumn("notes", new Column("body", "TEXT", false, "''")));
    Assert.areEqual("ALTER TABLE \"notes\" DROP COLUMN \"body\"", dialect.renderDropColumn("notes", "body"));
    Assert.areEqual("ALTER TABLE \"notes\" ADD CONSTRAINT \"PK_notes\" PRIMARY KEY (\"id\")", dialect.renderAddPrimaryKey("notes", new PrimaryKey(["id"])));
    Assert.areEqual("ALTER TABLE \"notes\" DROP CONSTRAINT \"PK_notes\"", dialect.renderDropPrimaryKey("notes"));
    Assert.areEqual("ALTER TABLE \"notes\" ADD CONSTRAINT \"FK_notes_projectId\" FOREIGN KEY (\"projectId\") REFERENCES \"projects\" (\"id\")",
      dialect.renderAddForeignKey("notes", new ForeignKey("projectId", "projects", "id")));
    Assert.areEqual("ALTER TABLE \"notes\" DROP CONSTRAINT \"FK_notes_projectId\"", dialect.renderDropForeignKey("notes", "projectId"));
  }

  @TestMethod
  public runsNothingAroundAMigrationAndChecksNoForeignKeysByDefault(): void {
    const dialect = SqlDialectTests.dialect;

    Assert.areEqual(0, dialect.formatMigrationStart().length);
    Assert.areEqual(0, dialect.formatMigrationEnd().length);
    Assert.isNull(dialect.formatForeignKeyCheck());
  }

  @TestMethod
  public defaultsANewRequiredColumnToZeroOrEmptyText(): void {
    Assert.areEqual("0", SqlDialectTests.dialect.formatDefaultValue(PropertyType.Integer));
    Assert.areEqual("''", SqlDialectTests.dialect.formatDefaultValue(PropertyType.String));
  }

  @TestMethod
  public async appliesAnOperationByRunningWhatItRendersAsync(): Promise<void> {
    const session = new RecordingSession();
    await SqlDialectTests.dialect.applyAsync(new SqlStatementOperation("DELETE FROM notes"), new SqlTransaction(session));

    Assert.areEqual("DELETE FROM notes", session.statements.at(-1));
  }

  @TestMethod
  public quotesIdentifiersAndDoublesTheirQuotes(): void {
    const dialect = SqlDialectTests.dialect;

    Assert.areEqual("\"entityId\"", dialect.quoteIdentifier("entityId"));
    Assert.areEqual("\"a\"\"b\"", dialect.quoteIdentifier("a\"b"));
    Assert.areEqual("\"\"", dialect.quoteIdentifier(""));
  }
}
