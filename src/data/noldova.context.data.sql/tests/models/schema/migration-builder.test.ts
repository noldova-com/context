/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ColumnType, CreateIndexOperation, CreateTableOperation, MigrationBuilder, SqlStatementOperation } from "@noldova/context.data.sql";
import { ArgumentException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import type { Note } from "../../fixtures/note.fixture.js";
import type { Owner } from "../../fixtures/owner.fixture.js";
import { TestDialect } from "../../fixtures/test-dialect.fixture.js";

@TestClass
export class MigrationBuilderTests {
  @TestMethod
  public collectsOperationsInDeclarationOrder(): void {
    const builder = new MigrationBuilder();
    builder.createIndex<Note>("notes", t => t.ownerId);
    builder.createTable<Note>("notes",
      table => {
        table.addColumn(t => t.id, ColumnType.Text);
        table.addColumn(t => t.ownerId, ColumnType.Text).makeNullable();
      },
      constraints => constraints.addPrimaryKey(t => t.id).addForeignKey<Owner>(t => t.ownerId, "owners", t => t.id));
    builder.createUniqueIndex<Note>("notes", t => t.ownerId, t => t.id);

    const operations = builder.toOperations();
    const statements = operations.map(t => t.render(new TestDialect()));

    Assert.isInstanceOf(operations[0], CreateIndexOperation);
    Assert.isInstanceOf(operations[1], CreateTableOperation);
    Assert.areEqual("CREATE INDEX \"IX_notes_ownerId\" ON \"notes\" (\"ownerId\")", statements[0]);
    Assert.areEqual("CREATE TABLE \"notes\" (\"id\" TEXT NOT NULL, \"ownerId\" TEXT, PRIMARY KEY (\"id\"), FOREIGN KEY (\"ownerId\") REFERENCES \"owners\" (\"id\"))", statements[1]);
    Assert.areEqual("CREATE UNIQUE INDEX \"IX_notes_ownerId_id\" ON \"notes\" (\"ownerId\", \"id\")", statements[2]);
  }

  @TestMethod
  public createsATableWithoutConstraints(): void {
    const builder = new MigrationBuilder();
    builder.createTable<Note>("log", table => table.addColumn(t => t.text, ColumnType.Text));

    Assert.areEqual("CREATE TABLE \"log\" (\"text\" TEXT NOT NULL)", builder.toOperations()[0]?.render(new TestDialect()));
  }

  @TestMethod
  public keepsAStatementInDeclarationOrder(): void {
    const builder = new MigrationBuilder();
    builder.createIndex<Note>("notes", t => t.id);
    builder.executeSql("UPDATE notes SET text = 'x'");

    const operations = builder.toOperations();

    Assert.areEqual("UPDATE notes SET text = 'x'", operations[1]?.render(new TestDialect()));
    Assert.isInstanceOf(operations[1], SqlStatementOperation);
    Assert.throws(() => builder.executeSql(" "), ArgumentException);
  }

  @TestMethod
  public returnsACopyOfTheOperations(): void {
    const builder = new MigrationBuilder();
    builder.createIndex<Note>("notes", t => t.id);
    const operations = [...builder.toOperations()];
    operations.length = 0;

    Assert.areEqual(1, builder.toOperations().length);
  }

  @TestMethod
  public rejectsInvalidIndexes(): void {
    const builder = new MigrationBuilder();

    Assert.throws(() => builder.createIndex<Note>("", t => t.id), ArgumentException);
    Assert.throws(() => builder.createIndex<Note>("notes"), ArgumentException);
    Assert.throws(() => builder.createUniqueIndex<Note>("notes"), ArgumentException);
  }
}
