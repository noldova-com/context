/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MigrationFile } from "@noldova/context.data.tools/models/migrations/migration-file.js";
import { MigrationListWriter } from "@noldova/context.data.tools/services/migration-list-writer.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class MigrationListWriterTests {
  @TestMethod
  public importsAndListsEachMigrationInTheOrderGiven(): void {
    const migrations = [new MigrationFile("20261127120000-add-notes", "AddNotes"), new MigrationFile("20261127130000-add-owners", "AddOwners")];

    Assert.areEqual([
      "import type { SqlMigration } from \"@noldova/context.data.sql\";",
      "",
      "import { AddNotes } from \"./20261127120000-add-notes.js\";",
      "import { AddOwners } from \"./20261127130000-add-owners.js\";",
      "",
      "export class NotesContextMigrations {",
      "  public static readonly all: readonly SqlMigration[] = [",
      "    new AddNotes(),",
      "    new AddOwners()",
      "  ];",
      "}",
      ""
    ].join("\n"), MigrationListWriter.write("NotesContextMigrations", migrations));
  }
}
