/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { AlterColumnOperation, Column, ForeignKey, PrimaryKey, SchemaDiffer, Table } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TestDialect } from "../fixtures/test-dialect.fixture.js";

@TestClass
export class SchemaDifferTests {
  @TestMethod
  public findsNothingBetweenMatchingSchemas(): void {
    const tables = [SchemaDifferTests.table("notes", ["id"], [], "id TEXT", "text TEXT?")];
    const same = [SchemaDifferTests.table("notes", ["id"], [], "id text", "text TEXT?")];

    Assert.areEqual(0, SchemaDiffer.diff(tables, same).length);
  }

  @TestMethod
  public ordersTheOperationsSoThatADatabaseAcceptsThem(): void {
    const source = [
      SchemaDifferTests.table("owners", ["id"], [], "id TEXT"),
      SchemaDifferTests.table("notes", ["id"], [new ForeignKey("ownerId", "owners", "id")], "id TEXT", "title TEXT", "text TEXT?", "ownerId TEXT"),
      SchemaDifferTests.table("drafts", ["id"], [new ForeignKey("noteId", "notes", "id")], "id TEXT", "noteId TEXT"),
      SchemaDifferTests.table("old", ["id"], [], "id TEXT"),
      SchemaDifferTests.table("older", ["id"], [new ForeignKey("oldId", "old", "id")], "id TEXT", "oldId TEXT")
    ];
    const target = [
      SchemaDifferTests.table("posts", ["id"], [new ForeignKey("authorId", "authors", "id")], "id TEXT", "authorId TEXT"),
      SchemaDifferTests.table("owners", ["id"], [], "id TEXT"),
      SchemaDifferTests.table("notes", ["id", "title"], [new ForeignKey("draftId", "drafts", "id")], "id TEXT", "title INTEGER?", "ownerId TEXT",
        "body TEXT=''", "draftId TEXT?=''"),
      SchemaDifferTests.table("drafts", ["id"], [new ForeignKey("noteId", "notes", "id")], "id TEXT", "noteId TEXT"),
      SchemaDifferTests.table("authors", ["id"], [], "id TEXT=''")
    ];

    const statements = SchemaDiffer.diff(source, target).map(t => t.render(new TestDialect()));

    Assert.areEqual([
      "ALTER TABLE \"notes\" DROP CONSTRAINT \"FK_notes_ownerId\"",
      "DROP TABLE \"older\"",
      "DROP TABLE \"old\"",
      "ALTER TABLE \"notes\" DROP CONSTRAINT \"PK_notes\"",
      "ALTER TABLE \"notes\" DROP COLUMN \"text\"",
      "ALTER notes.title INTEGER NULL",
      "ALTER TABLE \"notes\" ADD COLUMN \"body\" TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE \"notes\" ADD COLUMN \"draftId\" TEXT",
      "ALTER TABLE \"notes\" ADD CONSTRAINT \"PK_notes\" PRIMARY KEY (\"id\", \"title\")",
      "CREATE TABLE \"authors\" (\"id\" TEXT NOT NULL, CONSTRAINT \"PK_authors\" PRIMARY KEY (\"id\"))",
      "CREATE TABLE \"posts\" (\"id\" TEXT NOT NULL, \"authorId\" TEXT NOT NULL, CONSTRAINT \"PK_posts\" PRIMARY KEY (\"id\"), "
        + "CONSTRAINT \"FK_posts_authorId\" FOREIGN KEY (\"authorId\") REFERENCES \"authors\" (\"id\"))",
      "ALTER TABLE \"notes\" ADD CONSTRAINT \"FK_notes_draftId\" FOREIGN KEY (\"draftId\") REFERENCES \"drafts\" (\"id\")"
    ].join("\n"), statements.join("\n"));
  }

  @TestMethod
  public givesAColumnMadeRequiredOrOfAnotherTypeItsNewDefault(): void {
    const source = [SchemaDifferTests.table("notes", ["id"], [], "id TEXT", "title TEXT?", "rank INTEGER", "body TEXT")];
    const target = [SchemaDifferTests.table("notes", ["id"], [], "id TEXT", "title TEXT=''", "rank TEXT=''", "body TEXT?=''")];

    const columns = SchemaDiffer.diff(source, target).filter(t => t instanceof AlterColumnOperation).map(t => t.column);

    Assert.areEqual("title:false:'',rank:false:'',body:true:null", columns.map(t => `${t.name}:${t.isNullable}:${t.defaultValueSql}`).join(","));
  }

  @TestMethod
  public treatsAForeignKeyToAnotherTableOrColumnAsDroppedAndAdded(): void {
    const source = [SchemaDifferTests.table("notes", ["id"], [new ForeignKey("ownerId", "owners", "id")], "id TEXT", "ownerId TEXT")];
    const toTable = [SchemaDifferTests.table("notes", ["id"], [new ForeignKey("ownerId", "people", "id")], "id TEXT", "ownerId TEXT")];
    const toColumn = [SchemaDifferTests.table("notes", ["id"], [new ForeignKey("ownerId", "owners", "code")], "id TEXT", "ownerId TEXT")];

    Assert.areEqual("DropForeignKeyOperation,AddForeignKeyOperation", SchemaDiffer.diff(source, toTable).map(t => t.constructor.name).join(","));
    Assert.areEqual("DropForeignKeyOperation,AddForeignKeyOperation", SchemaDiffer.diff(source, toColumn).map(t => t.constructor.name).join(","));
  }

  @TestMethod
  public addsAndDropsAKeyATableGainsOrLoses(): void {
    const keyed = [SchemaDifferTests.table("notes", ["id"], [], "id TEXT")];
    const unkeyed = [SchemaDifferTests.table("notes", [], [], "id TEXT")];

    Assert.areEqual("AddPrimaryKeyOperation", SchemaDiffer.diff(unkeyed, keyed).map(t => t.constructor.name).join(","));
    Assert.areEqual("DropPrimaryKeyOperation", SchemaDiffer.diff(keyed, unkeyed).map(t => t.constructor.name).join(","));
  }

  @TestMethod
  public createsATableThatRefersOnlyToItselfFirstAndKeepsTheGivenOrderOfACycle(): void {
    const left = SchemaDifferTests.table("left", ["id"], [new ForeignKey("rightId", "right", "id")], "id TEXT", "rightId TEXT?");
    const right = SchemaDifferTests.table("right", ["id"], [new ForeignKey("leftId", "left", "id")], "id TEXT", "leftId TEXT?");
    const tree = SchemaDifferTests.table("tree", ["id"], [new ForeignKey("parentId", "tree", "id")], "id TEXT", "parentId TEXT?");

    Assert.areEqual("tree,left,right", SchemaDiffer.diff([], [left, right, tree]).map(t => t.render(new TestDialect()).split("\"")[1]).join(","));
    Assert.areEqual("left,right", SchemaDiffer.diff([left, right], []).map(t => t.render(new TestDialect()).split("\"")[1]).join(","));
  }

  private static table(name: string, key: readonly string[], foreignKeys: readonly ForeignKey[], ...columns: readonly string[]): Table {
    return new Table(name, columns.map(t => {
      const [column = "", rest = ""] = t.split(" ");
      const [type = "", defaultValueSql = null] = rest.replace("?", "").split("=");

      return new Column(column, type, rest.includes("?"), defaultValueSql);
    }), key.length === 0 ? null : new PrimaryKey(key), foreignKeys);
  }
}
