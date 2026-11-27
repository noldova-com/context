/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CommandContext } from "@noldova/context";
import { DataToolsException, MigrationsCommand } from "@noldova/context.data.tools";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RecordingOutput } from "../fixtures/recording-output.fixture.js";
import { ToolProject } from "../fixtures/tool-project.fixture.js";

@TestClass
export class MigrationsCommandTests {
  @TestMethod
  public namesItselfForCtx(): void {
    const command = new MigrationsCommand();

    Assert.areEqual("migrations", command.name);
    Assert.areEqual("Adds the next migration of a data context from its model.", command.description);
  }

  @TestMethod
  @TestData([])
  @TestData(["add", "--help"])
  @TestData(["-h"])
  public async showsItsUseAsync(arguments_: readonly string[]): Promise<void> {
    const output = new RecordingOutput();

    Assert.areEqual(0, await new MigrationsCommand().runAsync(new CommandContext("notes.ctxp", arguments_, output)));
    Assert.areEqual("Usage: ctx migrations add <Name> --provider <identity> [--context <Class>] [--output <folder>]", output.lines[0]);
  }

  @TestMethod
  public async addsTheMigrationAndSaysWhatItWroteAsync(): Promise<void> {
    await using project = await ToolProject.createAsync();
    await project.copyVersionAsync("v1", null, "sqlite");
    const output = new RecordingOutput();

    const exitCode = await new MigrationsCommand().runAsync(new CommandContext(project.projectFilePath,
      ["add", "AddNotes", "--provider", "noldova.context.data.sql.sqlite"], output));

    Assert.areEqual(0, exitCode);
    Assert.areEqual(3, output.lines.length);
    Assert.isTrue(output.lines.every(t => t.startsWith(`Wrote "${project.path("src/migrations/sqlite")}`)), output.lines.join("\n"));
  }

  @TestMethod
  public async saysSoWhenTheModelMatchesTheLastSnapshotAsync(): Promise<void> {
    await using project = await ToolProject.createAsync();
    await project.copyVersionAsync("v3", "v3", "postgresql");
    const output = new RecordingOutput();

    const exitCode = await new MigrationsCommand().runAsync(new CommandContext(project.projectFilePath,
      ["add", "Again", "--provider", "noldova.context.data.sql.postgresql"], output));

    Assert.areEqual(0, exitCode);
    Assert.areEqual("The model matches the last migration's snapshot: no migration was added.", output.lines.join("\n"));
  }

  @TestMethod
  public async throwsForWhatItCannotDoSoThatCtxReportsItAsync(): Promise<void> {
    await using project = await ToolProject.createAsync();
    const output = new RecordingOutput();

    const exception = await Assert.throwsAsync(() => new MigrationsCommand().runAsync(new CommandContext(project.projectFilePath, ["add", "AddNotes"], output)),
      DataToolsException);

    Assert.areEqual("Name the SQL provider with --provider, such as --provider noldova.context.data.sql.sqlite.", exception.message);
    Assert.areEqual(0, output.lines.length);
  }
}
