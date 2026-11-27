/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Index } from "@noldova/context.data";
import { Column, ForeignKey, PrimaryKey, SqlDialect, Table } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

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
    Assert.areEqual("PRIMARY KEY (\"conversationId\", \"sequence\")", dialect.renderPrimaryKey(new PrimaryKey(["conversationId", "sequence"])));
    Assert.areEqual("FOREIGN KEY (\"projectId\") REFERENCES \"projects\" (\"id\")", dialect.renderForeignKey(new ForeignKey("projectId", "projects", "id")));
  }

  @TestMethod
  public rendersTablesAndIndexes(): void {
    const dialect = SqlDialectTests.dialect;
    const columns = [new Column("id", "TEXT", false), new Column("projectId", "TEXT", false), new Column("text", "TEXT", true)];
    const notes = new Table("notes", columns, new PrimaryKey(["id"]), [new ForeignKey("projectId", "projects", "id")]);
    const log = new Table("log", [new Column("text", "TEXT", true)], null, []);

    Assert.areEqual(
      "CREATE TABLE \"notes\" (\"id\" TEXT NOT NULL, \"projectId\" TEXT NOT NULL, \"text\" TEXT, PRIMARY KEY (\"id\"), " +
      "FOREIGN KEY (\"projectId\") REFERENCES \"projects\" (\"id\"))",
      dialect.renderCreateTable(notes));
    Assert.areEqual("CREATE TABLE \"log\" (\"text\" TEXT)", dialect.renderCreateTable(log));
    Assert.areEqual("CREATE INDEX \"IX_notes_text\" ON \"notes\" (\"text\")", dialect.renderCreateIndex(new Index("IX_notes_text", "notes", ["text"], false)));
    Assert.areEqual(
      "CREATE UNIQUE INDEX \"IX_notes_id_text\" ON \"notes\" (\"id\", \"text\")",
      dialect.renderCreateIndex(new Index("IX_notes_id_text", "notes", ["id", "text"], true)));
  }

  @TestMethod
  public quotesIdentifiersAndDoublesTheirQuotes(): void {
    const dialect = SqlDialectTests.dialect;

    Assert.areEqual("\"entityId\"", dialect.quoteIdentifier("entityId"));
    Assert.areEqual("\"a\"\"b\"", dialect.quoteIdentifier("a\"b"));
    Assert.areEqual("\"\"", dialect.quoteIdentifier(""));
  }
}
