/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import "@noldova/context.core";
import { CommandHost } from "@noldova/context";
import { JsonReader } from "@noldova/context.json";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { ProjectFolder } from "../fixtures/project-folder.fixture.js";
import { ProviderSource } from "../fixtures/provider-source.fixture.js";
import { RecordingOutput } from "../fixtures/recording-output.fixture.js";

@TestClass
export class CommandHostTests {
  private static readonly SDK: string = "noldova.context.testsdk";
  private static readonly TOOL: string = "noldova.context.testtool";
  private static readonly UNNAMED: string = "noldova.context.testother";
  private static readonly LIBRARY: object = { name: "noldova.context.app", kind: "library", sdk: CommandHostTests.SDK };

  @TestMethod
  public listsNoCommandWithoutAProjectAsync(): Promise<void> {
    return ProjectFolder.useAsync(async folder => {
      const output = new RecordingOutput();

      const exitCode = await new CommandHost(output).runAsync([], folder.directory);

      Assert.areEqual(0, exitCode);
      Assert.areEqual("Usage: ctx <command> [arguments], ctx --help or ctx --version|" +
        "No project file (.ctxp) is in this folder; the commands come from the SDK and tools a project names.", output.lines.join("|"));
    });
  }

  @TestMethod
  public listsTheProjectsCommandsInNameOrderAsync(): Promise<void> {
    return ProjectFolder.useAsync(async folder => {
      await folder.writeProjectAsync({ ...CommandHostTests.LIBRARY, tools: [CommandHostTests.TOOL] });
      await folder.writeProviderAsync(CommandHostTests.SDK, ProjectFolder.command("MigrateCommand", "migrate", 0));
      await folder.writeProviderAsync(CommandHostTests.TOOL, `${ProjectFolder.command("BuildCommand", "build", 0)}export class Helper {}\nexport const value = 1;\n`);
      const output = new RecordingOutput();

      const exitCode = await new CommandHost(output).runAsync(["--help"], folder.directory);

      Assert.areEqual(0, exitCode);
      Assert.areEqual("Usage: ctx <command> [arguments], ctx --help or ctx --version|Commands:|  build       Runs build.|  migrate     Runs migrate.", output.lines.join("|"));
    });
  }

  @TestMethod
  public leavesOutAProviderTheProjectDoesNotNameAsync(): Promise<void> {
    return ProjectFolder.useAsync(async folder => {
      await folder.writeProjectAsync(CommandHostTests.LIBRARY);
      await folder.writeProviderAsync(CommandHostTests.SDK, ProjectFolder.command("BuildCommand", "build", 0));
      await folder.writeProviderAsync(CommandHostTests.UNNAMED, ProjectFolder.command("DeployCommand", "deploy", 0));
      const output = new RecordingOutput();

      const helpExitCode = await new CommandHost(output).runAsync(["--help"], folder.directory);
      const deployExitCode = await new CommandHost(output).runAsync(["deploy"], folder.directory);

      Assert.areEqual(0, helpExitCode);
      Assert.areEqual("Usage: ctx <command> [arguments], ctx --help or ctx --version|Commands:|  build       Runs build.", output.lines.join("|"));
      Assert.areEqual(1, deployExitCode);
      Assert.areEqual("\"deploy\" is not a command of this project; ctx --help lists them.", output.errorLines.join("|"));
    });
  }

  @TestMethod
  public printsTheHostsVersionAsync(): Promise<void> {
    return ProjectFolder.useAsync(async folder => {
      const version = JsonReader.parse(await readFile(fileURLToPath(import.meta.resolve("@noldova/context/package.json")), "utf8")).readNonBlankString("version");

      for (const option of ["-v", "--version"]) {
        const output = new RecordingOutput();

        const exitCode = await new CommandHost(output).runAsync([option], folder.directory);

        Assert.areEqual(0, exitCode);
        Assert.areEqual(`Context ${version}`, output.lines.join("|"));
      }
    });
  }

  @TestMethod
  public runsAProvidersCommandWithItsArgumentsAsync(): Promise<void> {
    return ProjectFolder.useAsync(async folder => {
      const manifestPath = await folder.writeProjectAsync(CommandHostTests.LIBRARY);
      await folder.writeProviderAsync(CommandHostTests.SDK, ProjectFolder.command("BuildCommand", "build", 3));
      const output = new RecordingOutput();

      const exitCode = await new CommandHost(output).runAsync(["build", "--release", "--", "--project", "x"], folder.directory);

      Assert.areEqual(3, exitCode);
      Assert.areEqual(`${manifestPath} --release -- --project x`, output.lines.join("|"));
    });
  }

  @TestMethod
  public refusesACommandWithoutAProjectAsync(): Promise<void> {
    return ProjectFolder.useAsync(async folder => {
      const output = new RecordingOutput();

      const exitCode = await new CommandHost(output).runAsync(["build"], folder.directory);

      Assert.areEqual(1, exitCode);
      Assert.areEqual(`No project file (.ctxp) is in "${folder.directory}".`, output.errorLines.join("|"));
    });
  }

  @TestMethod
  public refusesAFolderWithTwoProjectsAsync(): Promise<void> {
    return ProjectFolder.useAsync(async folder => {
      await folder.writeProjectAsync(CommandHostTests.LIBRARY, "b.ctxp");
      await folder.writeProjectAsync(CommandHostTests.LIBRARY, "a.ctxp");
      await folder.writeAsync("c.ctxp/readme.txt", "a folder, not a project file");
      const output = new RecordingOutput();

      const exitCode = await new CommandHost(output).runAsync(["--help"], folder.directory);

      Assert.areEqual(1, exitCode);
      Assert.areEqual(`"${folder.directory}" holds 2 project files (a.ctxp, b.ctxp).`, output.errorLines.join("|"));
    });
  }

  @TestMethod
  public refusesAProviderThatIsNotInstalledAsync(): Promise<void> {
    return CommandHostTests.assertFailsAsync([], ["build"],
      t => `The project "${t.path("app.ctxp")}" names "${CommandHostTests.SDK}", but @noldova/context.testsdk is not installed for it.`);
  }

  @TestMethod
  public refusesAProviderThatFailsToLoadAsync(): Promise<void> {
    return CommandHostTests.assertFailsAsync([new ProviderSource(CommandHostTests.SDK, "throw new Error(\"broken\");\n")], ["build"], `"${CommandHostTests.SDK}" could not be loaded: broken`);
  }

  @TestMethod
  public refusesAProviderThatThrowsSomethingOtherThanAnErrorAsync(): Promise<void> {
    return CommandHostTests.assertFailsAsync([new ProviderSource(CommandHostTests.SDK, "throw \"broken\";\n")], ["build"], `"${CommandHostTests.SDK}" could not be loaded: broken`);
  }

  @TestMethod
  public refusesAProviderWhoseCommandCannotBeMadeAsync(): Promise<void> {
    return CommandHostTests.assertFailsAsync([new ProviderSource(CommandHostTests.SDK,
      "export class BrokenCommand extends Command {\n  constructor() {\n    super();\n    throw new Error(\"no settings\");\n  }\n}\n")], ["build"],
      `"${CommandHostTests.SDK}" could not make its command BrokenCommand: no settings`);
  }

  @TestMethod
  public refusesAProviderWithoutCommandsAsync(): Promise<void> {
    return CommandHostTests.assertFailsAsync([new ProviderSource(CommandHostTests.SDK, "export class Helper {}\n")], ["build"],
      `"${CommandHostTests.SDK}" offers no commands: it exports no class that extends Command.`);
  }

  @TestMethod
  public refusesTwoProvidersWithTheSameCommandAsync(): Promise<void> {
    return CommandHostTests.assertFailsAsync([new ProviderSource(CommandHostTests.SDK, ProjectFolder.command("BuildCommand", "build", 0)),
      new ProviderSource(CommandHostTests.TOOL, ProjectFolder.command("OtherBuildCommand", "build", 0))], ["--help"],
      `The command "build" is offered by both "${CommandHostTests.SDK}" and "${CommandHostTests.TOOL}".`, [CommandHostTests.TOOL]);
  }

  @TestMethod
  public refusesAnUnknownCommandAsync(): Promise<void> {
    return CommandHostTests.assertFailsAsync([new ProviderSource(CommandHostTests.SDK, ProjectFolder.command("BuildCommand", "build", 0))], ["publish"],
      "\"publish\" is not a command of this project; ctx --help lists them.");
  }

  @TestMethod
  public passesOnWhatACommandThrowsAsync(): Promise<void> {
    return ProjectFolder.useAsync(async folder => {
      await folder.writeProjectAsync(CommandHostTests.LIBRARY);
      await folder.writeProviderAsync(CommandHostTests.SDK,
        "export class FailCommand extends Command {\n  name = \"fail\";\n  description = \"Fails.\";\n  async runAsync() {\n    throw new RangeError(\"failed\");\n  }\n}\n");

      const error = await Assert.throwsAsync(() => new CommandHost(new RecordingOutput()).runAsync(["fail"], folder.directory), RangeError);

      Assert.areEqual("failed", error.message);
    });
  }

  private static assertFailsAsync(providers: readonly ProviderSource[], arguments_: readonly string[], message: string | ((folder: ProjectFolder) => string),
    tools: readonly string[] = []): Promise<void> {
    return ProjectFolder.useAsync(async folder => {
      await folder.writeProjectAsync({ ...CommandHostTests.LIBRARY, tools });
      for (const provider of providers)
        await folder.writeProviderAsync(provider.identity, provider.source);
      const output = new RecordingOutput();

      const exitCode = await new CommandHost(output).runAsync(arguments_, folder.directory);

      Assert.areEqual(1, exitCode);
      Assert.areEqual(Object.isString(message) ? message : message(folder), output.errorLines.join("|"));
    });
  }
}
