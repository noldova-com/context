/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { List } from "@noldova/context.collections";
import { Diagnostic, DiagnosticAuthority, DiagnosticCategory, DiagnosticCode, DiagnosticLocation, DiagnosticMessage } from "@noldova/context.diagnostics";
import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptSourceKind } from "@noldova/context.parsers.typescript";
import { SDKException } from "@noldova/context.sdk";
import type { Plugin } from "@noldova/context.sdk/plugins/models/plugin.js";
import { SourceFile } from "@noldova/context.sdk/plugins/models/source-file.js";
import { SourceOrigin } from "@noldova/context.sdk/plugins/models/source-origin.js";
import { PluginBuilder } from "@noldova/context.sdk/plugins/services/plugin-builder.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RecordingOutput } from "../../fixtures/recording-output.fixture.js";
import { SDKProject } from "../../fixtures/sdk-project.fixture.js";
import { TestPlugin } from "../../fixtures/test-plugin.fixture.js";

@TestClass
export class PluginBuilderTests {
  private static readonly manifest: object = { name: "notes", kind: "library", dependencies: { packages: [TestPlugin.packageIdentity] } };

  @TestMethod
  @TestData([])
  @TestData(["noldova.context.other"])
  public async runsOnlyThePluginsOfThePackagesTheProjectNamesAsync(packages: readonly string[]): Promise<void> {
    await using project = await SDKProject.createAsync(SDKProject.validSource);
    await project.writeManifestAsync({ name: "notes", kind: "library", dependencies: { packages } });
    const plugin = TestPlugin.replacing("= 1", "= 2");

    Assert.isTrue(await PluginBuilder.buildAsync(await project.readBuildAsync(), new List<Plugin>([plugin]), [], new RecordingOutput()));
    Assert.areEqual(0, plugin.runs);
    Assert.isTrue((await project.readAsync("build/index.js")).includes("value = 1"));
    Assert.isFalse(await project.existsAsync("_build"));
  }

  @TestMethod
  public async runsThePluginsInTheOrderOfThePackagesTheProjectNamesAsync(): Promise<void> {
    await using project = await SDKProject.createAsync(SDKProject.validSource);
    await project.writeManifestAsync({ name: "notes", kind: "library", dependencies: { packages: ["noldova.context.second", TestPlugin.packageIdentity] } });
    const order: string[] = [];
    const plugins = new List<Plugin>([
      new TestPlugin("first", () => order.push("first")),
      new TestPlugin("second", () => order.push("second"), "noldova.context.second")
    ]);

    Assert.isTrue(await PluginBuilder.buildAsync(await project.readBuildAsync(), plugins, [], new RecordingOutput()));
    Assert.areEqual("second,first", order.join(","));
  }

  @TestMethod
  public async buildsTheProjectWithThePluginsChangesAsync(): Promise<void> {
    await using project = await PluginBuilderTests.createAsync(SDKProject.validSource);
    const plugin = TestPlugin.replacing("= 1", "= 2");

    Assert.isTrue(await PluginBuilder.buildAsync(await project.readBuildAsync(), new List<Plugin>([plugin]), [], new RecordingOutput()));
    Assert.areEqual(1, plugin.runs);
    Assert.isTrue((await project.readAsync("build/index.js")).includes("value = 2"));
    Assert.isTrue(await project.existsAsync("build/index.d.ts"));
    Assert.areEqual(SDKProject.validSource, await project.readAsync("src/index.ts"));
    Assert.areEqual("export const value: number = 2;", await project.readAsync("_build/.generated/src/index.ts"));
  }

  @TestMethod
  public async compilesTheProjectOnceWhenNoPluginChangesItAsync(): Promise<void> {
    await using project = await PluginBuilderTests.createAsync(SDKProject.validSource);
    const plugin = new TestPlugin("reader", () => undefined);

    Assert.isTrue(await PluginBuilder.buildAsync(await project.readBuildAsync(), new List<Plugin>([plugin]), [], new RecordingOutput()));
    Assert.areEqual(1, plugin.runs);
    Assert.isTrue(await project.existsAsync("build/index.js"));
    Assert.isFalse(await project.existsAsync("_build"));
  }

  @TestMethod
  public async writesTheOriginalSourcesErrorsAndFailsAsync(): Promise<void> {
    await using project = await PluginBuilderTests.createAsync("export const value: number = \"one\";");
    const output = new RecordingOutput();

    Assert.isFalse(await PluginBuilder.buildAsync(await project.readBuildAsync(), new List<Plugin>([TestPlugin.replacing("\"one\"", "1")]), [], output));
    Assert.isTrue(output.lines.some(t => t.startsWith("src/index.ts(1,14): error TS2322")));
    Assert.isFalse(await project.existsAsync("build/index.js"));
  }

  @TestMethod
  public async writesAnErrorInChangedTextAtItsOriginAsync(): Promise<void> {
    await using project = await PluginBuilderTests.createAsync("\n\nexport const value: number = 1;");
    const output = new RecordingOutput();

    Assert.isFalse(await PluginBuilder.buildAsync(await project.readBuildAsync(), new List<Plugin>([TestPlugin.replacing("= 1;", "= 1 +;")]), [], output));
    Assert.isTrue(output.lines.some(t => t.startsWith("src/index.ts(3,28): error TS1109")), output.lines.join("\n"));
    Assert.isFalse(output.lines.some(t => t.includes(".generated")));
  }

  @TestMethod
  @TestData("sourceMap")
  @TestData("inlineSourceMap")
  public async pointsAStackTraceAtTheOriginalSourceAsync(option: string): Promise<void> {
    await using project = await PluginBuilderTests.createAsync("/* lines */\nexport function fail(): void {\n  throw new Error(\"failed\");\n}\nfail();\n");
    await project.writeConfigurationAsync({ [option]: true });

    Assert.isTrue(await PluginBuilder.buildAsync(await project.readBuildAsync(),
      new List<Plugin>([TestPlugin.replacing("/* lines */", "const first: number = 1;\nconst second: number = 2;\nconst third: number = first + second;")]), [], new RecordingOutput()));
    const trace = await project.runWithSourceMapsAsync("build/index.js");

    Assert.isTrue((await project.readAsync("build/index.js")).includes("const third"));
    Assert.isTrue(trace.includes(`${project.path("src/index.ts")}:3:`), trace);
    Assert.isFalse(trace.includes(".generated"), trace);
  }

  @TestMethod
  public async compilesTheFilesAPluginAddsAsync(): Promise<void> {
    await using project = await PluginBuilderTests.createAsync(SDKProject.validSource);
    const plugin = new TestPlugin("adder", context => {
      for (const source of context.sources)
        context.addFile("models/added.ts", "export const added: number = 2;\n", new SourceOrigin(source, new SourceSpan(0, 0)));
    });

    Assert.isTrue(await PluginBuilder.buildAsync(await project.readBuildAsync(), new List<Plugin>([plugin]), [], new RecordingOutput()));
    Assert.isTrue(await project.existsAsync("build/models/added.js"));
    Assert.isTrue(await project.existsAsync("build/index.js"));
    Assert.isFalse(await project.existsAsync("src/models/added.ts"));
  }

  @TestMethod
  public async compilesTheProjectsOtherInputsWithThePluginsChangesAsync(): Promise<void> {
    await using project = await PluginBuilderTests.createAsync([
      "import data from \"./data.json\" with { type: \"json\" };",
      "import { other } from \"./other.mjs\";",
      "export const value: Counted = 1 + data.count + other;"
    ].join("\n"));
    await project.writeAsync("package.json", JSON.stringify({ type: "module" }));
    await project.writeAsync("tsconfig.json", JSON.stringify({
      compilerOptions: { rootDir: "src", outDir: "build", module: "nodenext", target: "es2022", strict: true, resolveJsonModule: true, types: [] },
      include: ["src", "types"]
    }));
    await project.writeAsync("src/data.json", JSON.stringify({ count: 2 }));
    await project.writeAsync("src/other.mts", "export const other: number = 3;");
    await project.writeAsync("types/globals.d.ts", "type Counted = number;");

    Assert.isTrue(await PluginBuilder.buildAsync(await project.readBuildAsync(), new List<Plugin>([TestPlugin.replacing("= 1", "= 2")]), [], new RecordingOutput()));
    Assert.isTrue((await project.readAsync("build/index.js")).includes("value = 2 + data.count"));
    Assert.isTrue((await project.readAsync("build/data.json")).includes("\"count\": 2"));
    Assert.isTrue(await project.existsAsync("build/other.mjs"));
  }

  @TestMethod
  public async writesNoOutputForANoEmitBuildAsync(): Promise<void> {
    await using project = await PluginBuilderTests.createAsync(SDKProject.validSource);

    Assert.isTrue(await PluginBuilder.buildAsync(await project.readBuildAsync(), new List<Plugin>([TestPlugin.replacing("= 1", "= 2")]), ["--noEmit"], new RecordingOutput()));
    Assert.isFalse(await project.existsAsync("build"));
  }

  @TestMethod
  @TestData(DiagnosticCategory.Error, "src/index.ts(1,14): error CTX9001: The value is wrong.", false)
  @TestData(DiagnosticCategory.Warning, "src/index.ts(1,14): warning CTX9001: The value is wrong.", true)
  public async writesThePluginsDiagnosticsAsync(category: DiagnosticCategory, line: string, built: boolean): Promise<void> {
    await using project = await PluginBuilderTests.createAsync(SDKProject.validSource);
    const output = new RecordingOutput();
    const plugin = new TestPlugin("reporter", context => {
      for (const source of context.sources)
        context.report(PluginBuilderTests.diagnosticOf(category, source.path, source.source.content.indexOf("value")));
    });

    Assert.areEqual(built, await PluginBuilder.buildAsync(await project.readBuildAsync(), new List<Plugin>([plugin]), [], output));
    Assert.areEqual(line, output.lines[0]);
    Assert.areEqual(built, await project.existsAsync("build/index.js"));
  }

  @TestMethod
  public async clearsTheGeneratedCopyBeforeWritingItAsync(): Promise<void> {
    await using project = await PluginBuilderTests.createAsync(SDKProject.validSource);
    await project.writeAsync("_build/.generated/src/stale.ts", "export const stale: number = 1;");

    Assert.isTrue(await PluginBuilder.buildAsync(await project.readBuildAsync(), new List<Plugin>([TestPlugin.replacing("= 1", "= 2")]), [], new RecordingOutput()));
    Assert.isTrue((await project.readAsync("build/index.js")).includes("value = 2"));
    Assert.isFalse(await project.existsAsync("build/stale.js"));
  }

  @TestMethod
  public async givesThePluginTheSourcesOfTheRootFolderAsync(): Promise<void> {
    await using project = await PluginBuilderTests.createAsync(SDKProject.validSource);
    await project.writeConfigurationAsync({ rootDir: "." });
    await project.writeAsync("src/sub/other.ts", SDKProject.validSource);
    await project.writeAsync("src/types.d.ts", "export {};");
    await project.writeAsync("build/old.ts", SDKProject.validSource);
    await project.writeAsync("_build/old.ts", SDKProject.validSource);
    await project.writeAsync("node_modules/package/index.ts", SDKProject.validSource);
    const seen: string[] = [];
    const plugin = new TestPlugin("reader", context => seen.push(context.projectName, ...context.sources.select(t => t.path)));

    Assert.isTrue(await PluginBuilder.buildAsync(await project.readBuildAsync(), new List<Plugin>([plugin]), [], new RecordingOutput()));
    Assert.areEqual(["notes", project.path("src/index.ts"), project.path("src/sub/other.ts")].join(","), seen.join(","));
  }

  @TestMethod
  public async givesThePluginNoSourcesForARootFolderThatDoesNotExistAsync(): Promise<void> {
    await using project = await PluginBuilderTests.createAsync(SDKProject.validSource);
    await project.writeConfigurationAsync({ rootDir: "missing" });
    const seen: number[] = [];
    const plugin = new TestPlugin("reader", context => seen.push(context.sources.count()));

    await PluginBuilder.buildAsync(await project.readBuildAsync(), new List<Plugin>([plugin]), [], new RecordingOutput());

    Assert.areEqual("0", seen.join(","));
  }

  @TestMethod
  public async readsAConfigurationTheWayTheCompilerDoesAsync(): Promise<void> {
    await using project = await PluginBuilderTests.createAsync(SDKProject.validSource);
    await project.writeAsync("tsconfig.json", [
      "{",
      "  // Written by hand.",
      "  \"extends\": [\"./configurations/base.json\", \"./configurations/folders\"],",
      "  \"include\": [\"src\",],",
      "}"
    ].join("\n"));
    await project.writeConfigurationAsync({}, "configurations/base.json");
    await project.writeAsync("configurations/folders.json", JSON.stringify({ compilerOptions: { rootDir: "../src", outDir: "../build" } }));

    Assert.isTrue(await PluginBuilder.buildAsync(await project.readBuildAsync(), new List<Plugin>([TestPlugin.replacing("= 1", "= 2")]), [], new RecordingOutput()));
    Assert.isTrue((await project.readAsync("build/index.js")).includes("value = 2"));
  }

  @TestMethod
  public async givesThePluginNoSourcesForAConfigurationWithNoInputsAsync(): Promise<void> {
    await using project = await PluginBuilderTests.createAsync(SDKProject.validSource);
    await project.writeAsync("tsconfig.json", JSON.stringify({ compilerOptions: { rootDir: "src", outDir: "build" }, include: ["nothing"] }));
    const seen: number[] = [];
    const plugin = new TestPlugin("reader", context => seen.push(context.sources.count()));

    Assert.isFalse(await PluginBuilder.buildAsync(await project.readBuildAsync(), new List<Plugin>([plugin]), [], new RecordingOutput()));
    Assert.areEqual("0", seen.join(","));
  }

  @TestMethod
  @TestData("{ \"compilerOptions\": { \"outDir\": \"build\" } }")
  @TestData("{ \"compilerOptions\": { \"rootDir\": \"src\" } }")
  @TestData("{}")
  public async refusesAConfigurationWithoutItsFoldersAsync(configuration: string): Promise<void> {
    await using project = await PluginBuilderTests.createAsync(SDKProject.validSource);
    await project.writeAsync("tsconfig.json", configuration);

    const exception = await Assert.throwsAsync(() => PluginBuilderTests.buildAsync(project, [TestPlugin.replacing("= 1", "= 2")]), SDKException);

    Assert.areEqual(`"${project.path("tsconfig.json")}" doesn't set both "compilerOptions.rootDir" and "compilerOptions.outDir", which a build with plugins needs.`,
      exception.message);
  }

  @TestMethod
  @TestData("{ \"extends\": \"./missing.json\" }")
  @TestData("{")
  public async writesTheCompilersErrorsForAConfigurationItCannotReadAsync(configuration: string): Promise<void> {
    await using project = await PluginBuilderTests.createAsync(SDKProject.validSource);
    await project.writeAsync("tsconfig.json", configuration);
    const output = new RecordingOutput();
    const plugin = TestPlugin.replacing("= 1", "= 2");

    Assert.isFalse(await PluginBuilder.buildAsync(await project.readBuildAsync(), new List<Plugin>([plugin]), [], output));
    Assert.areEqual(0, plugin.runs);
    Assert.isTrue(output.lines.some(t => t.includes("error TS")), output.lines.join("\n"));
  }

  @TestMethod
  public async refusesAProjectWithoutAConfigurationAsync(): Promise<void> {
    await using project = await PluginBuilderTests.createAsync(SDKProject.validSource);
    await project.removeAsync("tsconfig.json");

    const exception = await Assert.throwsAsync(() => PluginBuilderTests.buildAsync(project, [TestPlugin.replacing("= 1", "= 2")]), SDKException);

    Assert.areEqual(`"notes" has no "${project.path("tsconfig.json")}" beside its project file.`, exception.message);
  }

  @TestMethod
  public async refusesARootFolderOutsideTheProjectAsync(): Promise<void> {
    await using project = await PluginBuilderTests.createAsync(SDKProject.validSource);
    await project.writeConfigurationAsync({ rootDir: "../outside" });

    const exception = await Assert.throwsAsync(() => PluginBuilderTests.buildAsync(project, [TestPlugin.replacing("= 1", "= 2")]), SDKException);

    Assert.areEqual(`"notes" compiles "${project.path("../outside")}", outside its project folder: its compilerOptions.rootDir must be in the folder of its .ctxp.`,
      exception.message);
  }

  @TestMethod
  @TestData("1", "1")
  @TestData("", "")
  public async refusesTwoPluginsChangingTheSameTextAsync(first: string, second: string): Promise<void> {
    await using project = await PluginBuilderTests.createAsync(SDKProject.validSource);
    const plugins = [PluginBuilderTests.replacingAt("first", "= ", first), PluginBuilderTests.replacingAt("second", "= ", second)];

    const exception = await Assert.throwsAsync(() => PluginBuilderTests.buildAsync(project, plugins), SDKException);

    Assert.areEqual(`The plugins "first" and "second" change the same text of "${project.path("src/index.ts")}".`, exception.message);
  }

  @TestMethod
  public async appliesEditsNextToEachOtherAsync(): Promise<void> {
    await using project = await PluginBuilderTests.createAsync(SDKProject.validSource);

    Assert.isTrue(await PluginBuilderTests.buildAsync(project, [TestPlugin.replacing(";", " + 3;", "second"), TestPlugin.replacing("1", "2", "first")]));
    Assert.isTrue((await project.readAsync("build/index.js")).includes("value = 2 + 3"));
  }

  @TestMethod
  public async failsForAPluginThatThrowsAsync(): Promise<void> {
    await using project = await PluginBuilderTests.createAsync(SDKProject.validSource);
    const plugin = new TestPlugin("broken", () => {
      throw new Error("boom");
    });

    const exception = await Assert.throwsAsync(() => PluginBuilderTests.buildAsync(project, [plugin]), SDKException);

    Assert.areEqual("The plugin \"broken\" failed: Error: boom", exception.message);
  }

  @TestMethod
  public async refusesAChangeToAFileThatIsNotASourceAsync(): Promise<void> {
    await using project = await PluginBuilderTests.createAsync(SDKProject.validSource);
    const other = SourceFile.parse(project.path("other.ts"), SDKProject.validSource, TypeScriptSourceKind.Code);
    const plugin = new TestPlugin("stray", context => context.replace(other, new SourceSpan(0, 1), ""));

    const exception = await Assert.throwsAsync(() => PluginBuilderTests.buildAsync(project, [plugin]), SDKException);

    Assert.areEqual(`The plugin "stray" changes "${project.path("other.ts")}", which isn't one of the project's sources.`, exception.message);
  }

  @TestMethod
  @TestData("models\\added.ts")
  @TestData("/added.ts")
  @TestData("../added.ts")
  @TestData("./added.ts")
  @TestData("added.js")
  @TestData("added.d.ts")
  public async refusesAnAddedFileWithAnInvalidPathAsync(path: string): Promise<void> {
    await using project = await PluginBuilderTests.createAsync(SDKProject.validSource);

    const exception = await Assert.throwsAsync(() => PluginBuilderTests.buildAsync(project, [PluginBuilderTests.adding(path)]), SDKException);

    Assert.areEqual(`The plugin "adder" adds "${path}": an added file is a .ts path relative to the source root, with forward slashes and no "." or ".." segments.`,
      exception.message);
  }

  @TestMethod
  @TestData(["index.ts"])
  @TestData(["added.ts", "added.ts"])
  public async refusesAnAddedFileThatExistsAsync(paths: readonly string[]): Promise<void> {
    await using project = await PluginBuilderTests.createAsync(SDKProject.validSource);

    const exception = await Assert.throwsAsync(() => PluginBuilderTests.buildAsync(project, [PluginBuilderTests.adding(...paths)]), SDKException);

    Assert.areEqual(`The plugin "adder" adds "${paths.at(-1) ?? ""}", which is already a source or an added file.`, exception.message);
  }

  @TestMethod
  @TestData(true)
  @TestData(false)
  public async refusesADiagnosticOutsideTheSourcesAsync(hasLocation: boolean): Promise<void> {
    await using project = await PluginBuilderTests.createAsync(SDKProject.validSource);
    const message = new DiagnosticMessage(new DiagnosticCode(DiagnosticAuthority.context, 9001), DiagnosticCategory.Error, "Stray.", []);
    const diagnostic = new Diagnostic(message, hasLocation ? new DiagnosticLocation(project.path("other.ts"), 0, 1) : undefined, [], []);
    const plugin = new TestPlugin("reporter", context => context.report(diagnostic));

    const exception = await Assert.throwsAsync(() => PluginBuilderTests.buildAsync(project, [plugin]), SDKException);

    Assert.areEqual("The plugin \"reporter\" reports \"Stray.\" outside the project's sources: a diagnostic is located in a project source file.", exception.message);
  }

  private static async createAsync(source: string): Promise<SDKProject> {
    const project = await SDKProject.createAsync(source);
    await project.writeManifestAsync(PluginBuilderTests.manifest);

    return project;
  }

  private static async buildAsync(project: SDKProject, plugins: readonly TestPlugin[]): Promise<boolean> {
    return PluginBuilder.buildAsync(await project.readBuildAsync(), new List<Plugin>(plugins), [], new RecordingOutput());
  }

  private static replacingAt(name: string, after: string, text: string): TestPlugin {
    return new TestPlugin(name, context => {
      for (const source of context.sources)
        context.replace(source, new SourceSpan(source.source.content.indexOf(after) + after.length, text.length), "2");
    });
  }

  private static adding(...paths: readonly string[]): TestPlugin {
    return new TestPlugin("adder", context => {
      for (const source of context.sources)
        for (const path of paths)
          context.addFile(path, SDKProject.validSource, new SourceOrigin(source, new SourceSpan(0, 0)));
    });
  }

  private static diagnosticOf(category: DiagnosticCategory, path: string, start: number): Diagnostic {
    const message = new DiagnosticMessage(new DiagnosticCode(DiagnosticAuthority.context, 9001), category, "The value is wrong.", []);

    return new Diagnostic(message, new DiagnosticLocation(path, start, 5), [], []);
  }
}
