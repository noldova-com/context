/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PropertyType, type SnapshotBuilder } from "@noldova/context.data";
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
  SchemaDiffer,
  SqlSchema,
  Table
} from "@noldova/context.data.sql";
import { SQLiteDialect } from "@noldova/context.data.sql.sqlite";
import { MigrationWriter } from "@noldova/context.data.tools/services/migration-writer.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RecordedSnapshot } from "../fixtures/recorded-snapshot.fixture.js";

@TestClass
export class MigrationWriterTests {
  @TestMethod
  public writesAForeignKeyOverTwoColumnsAsOneForEachColumn(): void {
    const region = (t: SnapshotBuilder): void => {
      t.entity("Region").property("code", PropertyType.String).property("year", PropertyType.Integer).hasKey("code", "year");
    };
    const source = new RecordedSnapshot(t => {
      region(t);
      t.entity("Office").property("id", PropertyType.Integer).property("regionCode", PropertyType.String).property("regionYear", PropertyType.Integer).hasKey("id");
    });
    const target = new RecordedSnapshot(t => {
      region(t);
      t.entity("Office").property("id", PropertyType.Integer).property("regionCode", PropertyType.String).property("regionYear", PropertyType.Integer).hasKey("id")
        .hasForeignKey("Region", "regionCode", "regionYear");
    });
    const dialect = new SQLiteDialect();

    const text = MigrationWriter.write("LinkRegions", "20261127150000_LinkRegions",
      SchemaDiffer.diff(SqlSchema.fromSnapshot(source, dialect), SqlSchema.fromSnapshot(target, dialect)));

    Assert.areEqual([
      "    builder.addForeignKey(\"Office\", \"regionCode\", \"Region\", \"code\");",
      "    builder.addForeignKey(\"Office\", \"regionYear\", \"Region\", \"year\");"
    ].join(","), text.split("\n").filter(t => t.includes("builder.")).join(","));
  }

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
