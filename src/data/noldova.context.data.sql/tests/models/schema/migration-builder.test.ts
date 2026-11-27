/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  AddColumnOperation, AddForeignKeyOperation, AddPrimaryKeyOperation, AlterColumnOperation, CreateIndexOperation, CreateTableOperation, DropColumnOperation,
  DropForeignKeyOperation, DropPrimaryKeyOperation, DropTableOperation, MigrationBuilder, SqlStatementOperation
} from "@noldova/context.data.sql";
import { ArgumentException, InvalidOperationException } from "@noldova/context.exceptions";
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
        table.addColumn(t => t.id, "TEXT");
        table.addColumn(t => t.ownerId, "TEXT").makeNullable();
      },
      constraints => constraints.addPrimaryKey(t => t.id).addForeignKey<Owner>(t => t.ownerId, "owners", t => t.id));
    builder.createUniqueIndex<Note>("notes", t => t.ownerId, t => t.id);

    const operations = builder.toOperations();
    const statements = operations.map(t => t.render(new TestDialect()));

    Assert.isInstanceOf(operations[0], CreateIndexOperation);
    Assert.isInstanceOf(operations[1], CreateTableOperation);
    Assert.areEqual("CREATE INDEX \"IX_notes_ownerId\" ON \"notes\" (\"ownerId\")", statements[0]);
    Assert.areEqual("CREATE TABLE \"notes\" (\"id\" TEXT NOT NULL, \"ownerId\" TEXT, CONSTRAINT \"PK_notes\" PRIMARY KEY (\"id\"), "
      + "CONSTRAINT \"FK_notes_ownerId\" FOREIGN KEY (\"ownerId\") REFERENCES \"owners\" (\"id\"))", statements[1]);
    Assert.areEqual("CREATE UNIQUE INDEX \"UX_notes_ownerId_id\" ON \"notes\" (\"ownerId\", \"id\")", statements[2]);
  }

  @TestMethod
  public createsATableWithoutConstraints(): void {
    const builder = new MigrationBuilder();
    builder.createTable<Note>("log", table => table.addColumn(t => t.text, "TEXT"));

    Assert.areEqual("CREATE TABLE \"log\" (\"text\" TEXT NOT NULL)", builder.toOperations()[0]?.render(new TestDialect()));
  }

  @TestMethod
  public changesExistingTablesInDeclarationOrder(): void {
    const builder = new MigrationBuilder();
    builder.dropForeignKey("notes", "ownerId");
    builder.dropPrimaryKey("notes");
    builder.dropColumn("notes", "text");
    builder.alterColumn("notes", "title", "INTEGER").makeNullable();
    builder.addColumn("notes", "body", "TEXT").hasDefaultValue("");
    builder.addPrimaryKey("notes", "id", "title");
    builder.addForeignKey("notes", "ownerId", "owners", "id");
    builder.dropTable("owners");

    const operations = builder.toOperations();
    const statements = operations.map(t => t.render(new TestDialect()));

    Assert.areEqual("DropForeignKeyOperation,DropPrimaryKeyOperation,DropColumnOperation,AlterColumnOperation,AddColumnOperation,AddPrimaryKeyOperation,"
      + "AddForeignKeyOperation,DropTableOperation", operations.map(t => t.constructor.name).join(","));
    Assert.areEqual("ALTER notes.title INTEGER NULL", statements[3]);
    Assert.areEqual("ALTER TABLE \"notes\" ADD COLUMN \"body\" TEXT NOT NULL DEFAULT ''", statements[4]);
    Assert.areEqual("ALTER TABLE \"notes\" ADD CONSTRAINT \"PK_notes\" PRIMARY KEY (\"id\", \"title\")", statements[5]);
    Assert.areEqual("DROP TABLE \"owners\"", statements[7]);
    Assert.isInstanceOf(operations[0], DropForeignKeyOperation);
    Assert.isInstanceOf(operations[1], DropPrimaryKeyOperation);
    Assert.isInstanceOf(operations[2], DropColumnOperation);
    Assert.isInstanceOf(operations[3], AlterColumnOperation);
    Assert.isInstanceOf(operations[4], AddColumnOperation);
    Assert.isInstanceOf(operations[5], AddPrimaryKeyOperation);
    Assert.isInstanceOf(operations[6], AddForeignKeyOperation);
    Assert.isInstanceOf(operations[7], DropTableOperation);
  }

  @TestMethod
  public takesAColumnAsItsBuilderLeavesIt(): void {
    const builder = new MigrationBuilder();
    const column = builder.addColumn("notes", "body", "TEXT");
    column.makeNullable();

    const operation = builder.toOperations()[0];

    Assert.isTrue(operation instanceof AddColumnOperation && operation.column.isNullable);
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

  @TestMethod
  public namesAUniqueIndexApartFromAPlainOne(): void {
    const builder = new MigrationBuilder();
    builder.createIndex<Note>("notes", t => t.text);
    builder.createUniqueIndex<Note>("notes", t => t.text);

    Assert.areEqual("IX_notes_text,UX_notes_text", builder.toOperations().map(t => t instanceof CreateIndexOperation ? t.index.name : "").join(","));
  }

  @TestMethod
  public rejectsAnIndexNameTheMigrationAlreadyCreates(): void {
    const builder = new MigrationBuilder();
    builder.createIndex<Note>("notes_id", t => t.text);

    const exception = Assert.throws(() => builder.createIndex<Note>("notes", t => t.id, t => t.text), InvalidOperationException);
    Assert.throws(() => builder.createIndex<Note>("notes_id", t => t.text), InvalidOperationException);

    Assert.areEqual("The index name \"IX_notes_id_text\" is the same as \"IX_notes_id_text\", which the migration already creates, "
      + "once ASCII letters are lower-cased and both are cut to 63 bytes.", exception.message);
    Assert.areEqual(1, builder.toOperations().length);
  }

  @TestMethod
  public rejectsANameThatDiffersOnlyInTheCaseOfAnAsciiLetter(): void {
    const builder = new MigrationBuilder();
    builder.createIndex<Note>("notes", t => t.text);
    builder.createIndex<Note>("É", t => t.text);
    builder.createIndex<Note>("é", t => t.text);

    const exception = Assert.throws(() => builder.createIndex<Note>("Notes", t => t.text), InvalidOperationException);

    Assert.areEqual("The index name \"IX_Notes_text\" is the same as \"IX_notes_text\", which the migration already creates, "
      + "once ASCII letters are lower-cased and both are cut to 63 bytes.", exception.message);
    Assert.areEqual(3, builder.toOperations().length);
  }

  @TestMethod
  public rejectsANameThatMatchesInItsFirst63Bytes(): void {
    const builder = new MigrationBuilder();
    builder.createIndex<Note>("t".repeat(60), t => t.text);
    builder.createIndex<Note>(`${"t".repeat(59)}é`, t => t.text);

    Assert.throws(() => builder.createIndex<Note>("t".repeat(60), t => t.id), InvalidOperationException);
    Assert.throws(() => builder.createIndex<Note>(`${"t".repeat(59)}ā`, t => t.id), InvalidOperationException);
    builder.createIndex<Note>(`${"t".repeat(58)}€`, t => t.text);
    Assert.throws(() => builder.createIndex<Note>(`${"t".repeat(58)}😀`, t => t.id), InvalidOperationException);
    Assert.areEqual(3, builder.toOperations().length);
  }
}
