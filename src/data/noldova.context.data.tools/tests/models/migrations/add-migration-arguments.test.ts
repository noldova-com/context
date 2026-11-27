/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataToolsException } from "@noldova/context.data.tools";
import { AddMigrationArguments } from "@noldova/context.data.tools/models/migrations/add-migration-arguments.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class AddMigrationArgumentsTests {
  @TestMethod
  public readsTheNameAndTheOptionsInAnyOrder(): void {
    const arguments_ = AddMigrationArguments.parse(["add", "--output", "data/migrations", "AddNotes", "--context", "NotesContext", "--provider",
      "noldova.context.data.sql.postgresql"]);

    Assert.areEqual("AddNotes", arguments_.name);
    Assert.areEqual("noldova.context.data.sql.postgresql", arguments_.provider);
    Assert.areEqual("postgresql", arguments_.providerName);
    Assert.areEqual("NotesContext", arguments_.context);
    Assert.areEqual("data/migrations", arguments_.output);
  }

  @TestMethod
  public leavesTheContextAndTheOutputToBeFound(): void {
    const arguments_ = AddMigrationArguments.parse(["add", "AddNotes", "--provider", "noldova.context.data.sql.sqlite"]);

    Assert.isNull(arguments_.context);
    Assert.isNull(arguments_.output);
  }

  @TestMethod
  @TestData(["remove", "AddNotes"], "\"ctx migrations remove\" is unknown; ctx migrations --help shows its use.")
  @TestData([], "\"ctx migrations \" is unknown; ctx migrations --help shows its use.")
  @TestData(["add", "AddNotes", "--name", "x"], "The option \"--name\" is unknown; ctx migrations --help lists the options.")
  @TestData(["add", "AddNotes", "--context", "A", "--context", "B"], "The option \"--context\" is given more than once.")
  @TestData(["add", "AddNotes", "--provider"], "The option \"--provider\" needs a value.")
  @TestData(["add", "AddNotes", "--output", "--provider", "noldova.context.data.sql.sqlite"], "The option \"--output\" needs a value.")
  @TestData(["add", "--provider", "noldova.context.data.sql.sqlite"], "Name the migration once, such as AddNotes; 0 names were given.")
  @TestData(["add", "AddNotes", "AddTags", "--provider", "noldova.context.data.sql.sqlite"], "Name the migration once, such as AddNotes; 2 names were given.")
  @TestData(["add", "add-notes", "--provider", "noldova.context.data.sql.sqlite"],
    "The migration name \"add-notes\" isn't PascalCase: begin with a capital letter and use only letters and digits, such as AddNotes.")
  @TestData(["add", "AddNotes"], "Name the SQL provider with --provider, such as --provider noldova.context.data.sql.sqlite.")
  @TestData(["add", "AddNotes", "--provider", "sqlite"], "\"sqlite\" isn't a provider identity, such as noldova.context.data.sql.sqlite.")
  public failsForArgumentsItCannotRead(arguments_: readonly string[], message: string): void {
    Assert.areEqual(message, Assert.throws(() => AddMigrationArguments.parse(arguments_), DataToolsException).message);
  }
}
