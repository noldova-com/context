/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  AddColumnOperation,
  AddForeignKeyOperation,
  AddPrimaryKeyOperation,
  AlterColumnOperation,
  Column,
  CreateTableOperation,
  DropColumnOperation,
  DropForeignKeyOperation,
  DropPrimaryKeyOperation,
  DropTableOperation,
  ForeignKey,
  PrimaryKey,
  Table
} from "@noldova/context.data.sql";
import { MigrationWriter } from "@noldova/context.data.tools/services/migration-writer.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class MigrationWriterTests {
  @TestMethod
  public writesOneBuilderCallForEachDifference(): void {
    const differences = [
      new DropForeignKeyOperation("tags", "noteId"),
      new DropTableOperation("drafts"),
      new DropPrimaryKeyOperation("notes"),
      new DropColumnOperation("notes", "text"),
      new AlterColumnOperation("notes", new Column("title", "TEXT", true)),
      new AddColumnOperation("notes", new Column("rank", "INTEGER", false, "0")),
      new AddColumnOperation("notes", new Column("summary", "TEXT", true)),
      new AddPrimaryKeyOperation("notes", new PrimaryKey(["id", "ownerId"])),
      new CreateTableOperation(new Table("owners", [new Column("id", "INTEGER", false), new Column("name", "TEXT", true)], new PrimaryKey(["id"]),
        [new ForeignKey("parentId", "owners", "id")])),
      new CreateTableOperation(new Table("log", [new Column("text", "TEXT", false)], null, [])),
      new AddForeignKeyOperation("notes", new ForeignKey("ownerId", "owners", "id"))
    ];

    Assert.areEqual([
      "import { type MigrationBuilder, SqlMigration } from \"@noldova/context.data.sql\";",
      "",
      "export class ChangeNotes extends SqlMigration {",
      "  public constructor() {",
      "    super(\"20261127120000_ChangeNotes\");",
      "  }",
      "",
      "  public override apply(builder: MigrationBuilder): void {",
      "    builder.dropForeignKey(\"tags\", \"noteId\");",
      "    builder.dropTable(\"drafts\");",
      "    builder.dropPrimaryKey(\"notes\");",
      "    builder.dropColumn(\"notes\", \"text\");",
      "    builder.alterColumn(\"notes\", \"title\", \"TEXT\").makeNullable();",
      "    builder.addColumn(\"notes\", \"rank\", \"INTEGER\").hasDefaultValueSql(\"0\");",
      "    builder.addColumn(\"notes\", \"summary\", \"TEXT\").makeNullable();",
      "    builder.addPrimaryKey(\"notes\", \"id\", \"ownerId\");",
      "    builder.createTable(\"owners\",",
      "      table => {",
      "        table.addColumn(\"id\", \"INTEGER\");",
      "        table.addColumn(\"name\", \"TEXT\").makeNullable();",
      "      },",
      "      constraints => {",
      "        constraints.addPrimaryKey(\"id\");",
      "        constraints.addForeignKey(\"parentId\", \"owners\", \"id\");",
      "      });",
      "    builder.createTable(\"log\",",
      "      table => {",
      "        table.addColumn(\"text\", \"TEXT\");",
      "      });",
      "    builder.addForeignKey(\"notes\", \"ownerId\", \"owners\", \"id\");",
      "  }",
      "}",
      ""
    ].join("\n"), MigrationWriter.write("ChangeNotes", "20261127120000_ChangeNotes", differences));
  }

  @TestMethod
  public writesAMigrationWithNoDifferenceWithAnUnusedBuilder(): void {
    Assert.areEqual([
      "import { type MigrationBuilder, SqlMigration } from \"@noldova/context.data.sql\";",
      "",
      "export class Nothing extends SqlMigration {",
      "  public constructor() {",
      "    super(\"20261127120000_Nothing\");",
      "  }",
      "",
      "  public override apply(_builder: MigrationBuilder): void { }",
      "}",
      ""
    ].join("\n"), MigrationWriter.write("Nothing", "20261127120000_Nothing", []));
  }

  @TestMethod
  public quotesNamesAsStringLiterals(): void {
    const text = MigrationWriter.write("Quoted", "20261127120000_Quoted", [new DropTableOperation("say \"hi\"\\now")]);

    Assert.isTrue(text.includes("builder.dropTable(\"say \\\"hi\\\"\\\\now\");"));
  }
}
