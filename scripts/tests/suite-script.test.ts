/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { copyFile, mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { ScriptRunner } from "./fixtures/script-runner.fixture.js";

@TestClass
export class SuiteScriptTests {
  private static readonly CONFIG_FILE_NAME: string = "config.ts";
  private static readonly DIRECTORY_PREFIX: string = "noldova-suite-script-";
  private static readonly DRIVER: string = `
    const [scriptsUrl] = process.argv.slice(1);
    const { default: PostgreSQLServer } = await import(new URL("postgresql-server.ts", scriptsUrl).href);
    const { default: SuiteScript } = await import(new URL("suite-script.ts", scriptsUrl).href);
    delete process.env[PostgreSQLServer.URL_VARIABLE];
    PostgreSQLServer.startAsync = async () => ({ url: "started", [Symbol.asyncDispose]: async () => {} });
    class Probe extends SuiteScript {
      async runAsync() {}
      async writeLogAsync() {}
      async executeProcessAsync(command, arguments_, directory, silent, environment) {
        this.url = environment[PostgreSQLServer.URL_VARIABLE] ?? "none";
      }
    }
    const probe = new Probe();
    const projects = await probe.listTestProjectsAsync();
    await probe.runSuiteAsync(projects, {});
    console.log([...projects.map(t => t.name), probe.url].join(" "));
  `;
  private static readonly REMOVAL_RETRIES: number = 5;
  private static readonly SCRIPT_EXTENSION: string = ".ts";
  private static readonly SCRIPTS_FOLDER_NAME: string = "scripts";

  @TestMethod
  public async startsPostgreSQLAndAddsTheScriptsProjectWhenConfigTurnsThemOnAsync(): Promise<void> {
    Assert.areEqual("scripts started", await SuiteScriptTests.runAsync(["START_POSTGRESQL = true", "TEST_SCRIPTS = true"]));
  }

  @TestMethod
  public async startsNoPostgreSQLAndAddsNoScriptsProjectWhenConfigTurnsThemOffAsync(): Promise<void> {
    Assert.areEqual("none", await SuiteScriptTests.runAsync(["START_POSTGRESQL = false", "TEST_SCRIPTS = false"]));
  }

  @TestMethod
  public async startsNoPostgreSQLAndAddsNoScriptsProjectWhenConfigLeavesThemOutAsync(): Promise<void> {
    Assert.areEqual("none", await SuiteScriptTests.runAsync([]));
  }

  @TestMethod
  public async takesEachSettingOnItsOwnAsync(): Promise<void> {
    Assert.areEqual("started", await SuiteScriptTests.runAsync(["START_POSTGRESQL = true"]));
    Assert.areEqual("scripts none", await SuiteScriptTests.runAsync(["TEST_SCRIPTS = true"]));
  }

  private static async runAsync(settings: readonly string[]): Promise<string> {
    const directory = await mkdtemp(path.join(tmpdir(), SuiteScriptTests.DIRECTORY_PREFIX));
    try {
      const scriptsFolder = path.join(directory, SuiteScriptTests.SCRIPTS_FOLDER_NAME);
      await mkdir(scriptsFolder);
      for (const name of await readdir(ScriptRunner.SCRIPTS_FOLDER))
        if (name.endsWith(SuiteScriptTests.SCRIPT_EXTENSION) && name !== SuiteScriptTests.CONFIG_FILE_NAME)
          await copyFile(path.join(ScriptRunner.SCRIPTS_FOLDER, name), path.join(scriptsFolder, name));
      await writeFile(path.join(scriptsFolder, SuiteScriptTests.CONFIG_FILE_NAME),
        `export default class Config {\n  static readonly BUILD_FOLDER = "_build/node";\n  static readonly PACKAGES_INFO = [];\n${settings.map(t => `  static readonly ${t};\n`).join("")}}\n`);

      return await ScriptRunner.runAsync(SuiteScriptTests.DRIVER, scriptsFolder, []);
    }
    finally {
      await rm(directory, { recursive: true, force: true, maxRetries: SuiteScriptTests.REMOVAL_RETRIES });
    }
  }
}
