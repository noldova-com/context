/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataToolsException } from "@noldova/context.data.tools";
import { ProjectSources } from "@noldova/context.data.tools/services/project-sources.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ToolProject } from "../fixtures/tool-project.fixture.js";

@TestClass
export class ProjectSourcesTests {
  @TestMethod
  public async readsTheFoldersFromTheConfigurationAndThoseItExtendsAsync(): Promise<void> {
    await using project = await ToolProject.createAsync();
    await project.writeAsync("tsconfig.json", JSON.stringify({ extends: "./config/base.json", compilerOptions: { outDir: "out" } }));
    await project.writeAsync("config/base.json", JSON.stringify({ compilerOptions: { rootDir: "../source", outDir: "ignored" } }));

    const sources = await ProjectSources.openAsync(project.projectFilePath);

    Assert.areEqual(project.path("source"), sources.rootDirectory);
    Assert.areEqual(project.path("out"), sources.outputDirectory);
    Assert.areEqual(project.path("src/data"), sources.resolve("src/data"));
  }

  @TestMethod
  @TestData("{", "isn't JSON the tool can read: ")
  @TestData("{ \"compilerOptions\": { \"rootDir\": 1 } }", "isn't JSON the tool can read: ")
  @TestData("{ \"compilerOptions\": { \"outDir\": \"build\" } }", "sets no \"compilerOptions.rootDir\", which the tool needs to find the sources and their compiled files.")
  @TestData("{ }", "sets no \"compilerOptions.rootDir\", which the tool needs to find the sources and their compiled files.")
  @TestData("{ \"compilerOptions\": null }", "sets no \"compilerOptions.rootDir\", which the tool needs to find the sources and their compiled files.")
  public async failsForAConfigurationWithoutTheFoldersAsync(text: string, message: string): Promise<void> {
    await using project = await ToolProject.createAsync();
    await project.writeAsync("tsconfig.json", text);

    const exception = await Assert.throwsAsync(() => ProjectSources.openAsync(project.projectFilePath), DataToolsException);

    Assert.isTrue(exception.message.startsWith(`"${project.path("tsconfig.json")}" ${message}`), exception.message);
  }

  @TestMethod
  public async failsWithoutAConfigurationAsync(): Promise<void> {
    await using project = await ToolProject.createAsync();

    const exception = await Assert.throwsAsync(() => ProjectSources.openAsync(project.path("other/notes.ctxp")), DataToolsException);

    Assert.areEqual(`The TypeScript configuration "${project.path("other/tsconfig.json")}" can't be read; the tool reads the "tsconfig.json" beside the project file.`,
      exception.message);
    Assert.isDefined(exception.cause);
  }

  @TestMethod
  public async readsTheTypeScriptSourcesOutsidePackageFoldersAsync(): Promise<void> {
    await using project = await ToolProject.createAsync();
    for (const path of ["src/b.ts", "src/a.d.ts", "src/node_modules/c.ts", "src/sub/a.ts", "src/e.js"])
      await project.writeAsync(path, `// ${path}`);
    const sources = await ProjectSources.openAsync(project.projectFilePath);

    const files = await sources.readSourcesAsync();

    Assert.areEqual("src/b.ts:// src/b.ts,src/sub/a.ts:// src/sub/a.ts", files.map(t => `${project.relative(t.path)}:${t.content}`).join(","));
  }

  @TestMethod
  public async listsAndWritesFilesAsync(): Promise<void> {
    await using project = await ToolProject.createAsync();
    const sources = await ProjectSources.openAsync(project.projectFilePath);

    Assert.areEqual(0, (await sources.listAsync(project.path("src/migrations"))).length);
    await sources.writeAsync(project.path("src/migrations/b.ts"), "b");
    await sources.writeAsync(project.path("src/migrations/a.ts"), "a");

    Assert.areEqual("a.ts,b.ts", (await sources.listAsync(project.path("src/migrations"))).join(","));
    Assert.areEqual("b", await sources.readAsync(project.path("src/migrations/b.ts")));
    Assert.isTrue(await sources.existsAsync(project.path("src/migrations/a.ts")));
    Assert.isFalse(await sources.existsAsync(project.path("src/migrations/c.ts")));
  }

  @TestMethod
  public async importsTheCompiledFileOfASourceAsync(): Promise<void> {
    await using project = await ToolProject.createAsync();
    await project.writeAsync("build/sub/value.js", "export const value = 7;\n");
    await project.writeAsync("build/broken.js", "throw new Error(\"broken\");\n");
    const sources = await ProjectSources.openAsync(project.projectFilePath);

    const loaded = await sources.importCompiledAsync(project.path("src/sub/value.ts"));
    const missing = await Assert.throwsAsync(() => sources.importCompiledAsync(project.path("src/absent.ts")), DataToolsException);
    const broken = await Assert.throwsAsync(() => sources.importCompiledAsync(project.path("src/broken.ts")), DataToolsException);

    Assert.areEqual(7, loaded["value"]);
    Assert.areEqual(`The compiled "${project.path("build/absent.js")}" of "${project.path("src/absent.ts")}" is missing: build the project first.`, missing.message);
    Assert.areEqual(`The compiled "${project.path("build/broken.js")}" can't be loaded: Error: broken`, broken.message);
  }

  @TestMethod
  public async importsAPackageInstalledForTheProjectAsync(): Promise<void> {
    await using project = await ToolProject.createAsync();
    const sources = await ProjectSources.openAsync(project.projectFilePath);

    const loaded = await sources.importPackageAsync("@noldova/context.data.sql.sqlite");

    Assert.isTrue("SQLiteDialect" in loaded);
  }
}
