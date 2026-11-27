/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CreateIndexOperation, CreateTableOperation, MigrationBuilder, SqlStatementOperation } from "@noldova/context.data.sql";
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
    Assert.areEqual("CREATE TABLE \"notes\" (\"id\" TEXT NOT NULL, \"ownerId\" TEXT, PRIMARY KEY (\"id\"), FOREIGN KEY (\"ownerId\") REFERENCES \"owners\" (\"id\"))", statements[1]);
    Assert.areEqual("CREATE UNIQUE INDEX \"UX_notes_ownerId_id\" ON \"notes\" (\"ownerId\", \"id\")", statements[2]);
  }

  @TestMethod
  public createsATableWithoutConstraints(): void {
    const builder = new MigrationBuilder();
    builder.createTable<Note>("log", table => table.addColumn(t => t.text, "TEXT"));

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
