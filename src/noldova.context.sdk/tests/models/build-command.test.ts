/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CommandContext } from "@noldova/context";
import { BuildCommand, SDKException } from "@noldova/context.sdk";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RecordingOutput } from "../fixtures/recording-output.fixture.js";
import { SDKProject } from "../fixtures/sdk-project.fixture.js";

@TestClass
export class BuildCommandTests {
  @TestMethod
  public namesItselfForCtx(): void {
    const command = new BuildCommand();

    Assert.areEqual("build", command.name);
    Assert.areEqual("Builds the project and the projects it depends on with their TypeScript compiler.", command.description);
  }

  @TestMethod
  @TestData(["-h"])
  @TestData(["--noEmit", "--help"])
  public async showsItsUseAsync(arguments_: readonly string[]): Promise<void> {
    const output = new RecordingOutput();

    Assert.areEqual(0, await new BuildCommand().runAsync(new CommandContext("notes.ctxp", arguments_, output)));
    Assert.areEqual("Usage: ctx build [<tsc options>]", output.lines[0]);
  }

  @TestMethod
  public async buildsTheProjectWithItsCompilerAsync(): Promise<void> {
    await using project = await SDKProject.createAsync(SDKProject.validSource);
    const output = new RecordingOutput();

    const code = await new BuildCommand().runAsync(new CommandContext(project.projectFilePath, [], output));

    Assert.areEqual(0, code);
    Assert.areEqual("Building \"notes\"...,Built \"notes\".", output.lines.join(","));
    Assert.isTrue(await project.existsAsync("build/index.js"));
  }

  @TestMethod
  public async buildsEachProjectAfterTheProjectsItDependsOnAsync(): Promise<void> {
    await using project = await SDKProject.createAsync("import { b } from \"../b/build/index.js\";\nexport const value: number = b + 1;");
    await project.writeManifestAsync({ name: "notes", kind: "library", dependencies: { projects: ["b/b.ctxp"] } });
    await project.writeProjectAsync("b", { name: "b", kind: "library", dependencies: { projects: ["../a/a.ctxp"] } },
      "import { a } from \"../../a/build/index.js\";\nexport const b: number = a + 1;");
    await project.writeProjectAsync("a", { name: "a", kind: "library" }, "export const a: number = 1;");
    const output = new RecordingOutput();

    const code = await new BuildCommand().runAsync(new CommandContext(project.projectFilePath, [], output));

    Assert.areEqual(0, code);
    Assert.areEqual("Building \"a\"...,Built \"a\".,Building \"b\"...,Built \"b\".,Building \"notes\"...,Built \"notes\".", output.lines.join(","));
    Assert.isTrue(await project.existsAsync("build/index.js"));
  }

  @TestMethod
  public async buildsNothingAfterTheFirstProjectThatFailsAsync(): Promise<void> {
    await using project = await SDKProject.createAsync(SDKProject.validSource);
    await project.writeManifestAsync({ name: "notes", kind: "library", dependencies: { projects: ["a/a.ctxp"] } });
    await project.writeProjectAsync("a", { name: "a", kind: "library" }, "export const a: number = \"one\";");
    const output = new RecordingOutput();

    const code = await new BuildCommand().runAsync(new CommandContext(project.projectFilePath, [], output));

    Assert.areEqual(1, code);
    Assert.isFalse(output.lines.includes("Building \"notes\"..."));
    Assert.isFalse(await project.existsAsync("build/index.js"));
    Assert.areEqual("\"a\" didn't build.", output.errorLines.join(","));
  }

  @TestMethod
  public async passesEveryArgumentToTheCompilerAsync(): Promise<void> {
    await using project = await SDKProject.createAsync(SDKProject.validSource);

    const code = await new BuildCommand().runAsync(new CommandContext(project.projectFilePath, ["--noEmit"], new RecordingOutput()));

    Assert.areEqual(0, code);
    Assert.isFalse(await project.existsAsync("build/index.js"));
  }

  @TestMethod
  public async writesTheCompilersErrorsAndFailsAsync(): Promise<void> {
    await using project = await SDKProject.createAsync("export const value: number = \"one\";");
    const output = new RecordingOutput();

    const code = await new BuildCommand().runAsync(new CommandContext(project.projectFilePath, [], output));

    Assert.areEqual(1, code);
    Assert.isTrue(output.lines.some(t => t.includes("error TS2322")));
    Assert.isFalse(output.lines.includes("Built \"notes\"."));
    Assert.areEqual("\"notes\" didn't build.", output.errorLines.join(","));
  }

  @TestMethod
  public async failsForAProjectWithNoConfigurationAsync(): Promise<void> {
    await using project = await SDKProject.createAsync(SDKProject.validSource);
    await project.removeAsync("tsconfig.json");

    const exception = await Assert.throwsAsync(() => new BuildCommand().runAsync(new CommandContext(project.projectFilePath, [], new RecordingOutput())),
      SDKException);

    Assert.areEqual(`"notes" has no "${project.path("tsconfig.json")}" beside its project file.`, exception.message);
  }

  @TestMethod
  public async failsForAProjectWithNoCompilerInstalledAsync(): Promise<void> {
    await using project = await SDKProject.createOutsideTheRepositoryAsync();

    const exception = await Assert.throwsAsync(() => new BuildCommand().runAsync(new CommandContext(project.projectFilePath, [], new RecordingOutput())),
      SDKException);

    Assert.areEqual("No TypeScript compiler is installed for \"notes\": install the typescript package for it.", exception.message);
  }
}
