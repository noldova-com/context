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
    const { default: SuiteScriptProbe } = await import(new URL("tests/fakes/suite-script.probe.ts", scriptsUrl).href);
    await new SuiteScriptProbe().runAsync();
  `;
  private static readonly FAKES_PATH: string = path.join("tests", "fakes");
  private static readonly FAKES_FOLDER: string = path.join(ScriptRunner.SCRIPTS_FOLDER, SuiteScriptTests.FAKES_PATH);
  private static readonly POSTGRESQL_SERVER_FAKE_FILE_NAME: string = "postgresql-server.fake.ts";
  private static readonly POSTGRESQL_SERVER_FILE_NAME: string = "postgresql-server.ts";
  private static readonly PROBE_FILE_NAME: string = "suite-script.probe.ts";
  private static readonly REMOVAL_RETRIES: number = 5;
  private static readonly SCRIPT_EXTENSION: string = ".ts";
  private static readonly SCRIPTS_FOLDER_NAME: string = "scripts";

  @TestMethod
  public async startsPostgreSQLAndAddsTheScriptsProjectWhenConfigTurnsThemOnAsync(): Promise<void> {
    Assert.areEqual("scripts:scripts/tsconfig.json started", await SuiteScriptTests.runAsync(["START_POSTGRESQL = true", "TEST_SCRIPTS = true"]));
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
    Assert.areEqual("scripts:scripts/tsconfig.json none", await SuiteScriptTests.runAsync(["TEST_SCRIPTS = true"]));
  }

  private static async runAsync(settings: readonly string[]): Promise<string> {
    const directory = await mkdtemp(path.join(tmpdir(), SuiteScriptTests.DIRECTORY_PREFIX));
    try {
      const scriptsFolder = path.join(directory, SuiteScriptTests.SCRIPTS_FOLDER_NAME);
      const fakesFolder = path.join(scriptsFolder, SuiteScriptTests.FAKES_PATH);
      await mkdir(fakesFolder, { recursive: true });
      for (const name of await readdir(ScriptRunner.SCRIPTS_FOLDER))
        if (name.endsWith(SuiteScriptTests.SCRIPT_EXTENSION) && name !== SuiteScriptTests.CONFIG_FILE_NAME && name !== SuiteScriptTests.POSTGRESQL_SERVER_FILE_NAME)
          await copyFile(path.join(ScriptRunner.SCRIPTS_FOLDER, name), path.join(scriptsFolder, name));
      await copyFile(path.join(SuiteScriptTests.FAKES_FOLDER, SuiteScriptTests.POSTGRESQL_SERVER_FAKE_FILE_NAME), path.join(scriptsFolder, SuiteScriptTests.POSTGRESQL_SERVER_FILE_NAME));
      await copyFile(path.join(SuiteScriptTests.FAKES_FOLDER, SuiteScriptTests.PROBE_FILE_NAME), path.join(fakesFolder, SuiteScriptTests.PROBE_FILE_NAME));
      await writeFile(path.join(scriptsFolder, SuiteScriptTests.CONFIG_FILE_NAME),
        `export default class Config {\n  static readonly BUILD_FOLDER = "_build/node";\n  static readonly PACKAGES_INFO = [];\n${settings.map(t => `  static readonly ${t};\n`).join("")}}\n`);

      return await ScriptRunner.runAsync(SuiteScriptTests.DRIVER, scriptsFolder, []);
    }
    finally {
      await rm(directory, { recursive: true, force: true, maxRetries: SuiteScriptTests.REMOVAL_RETRIES });
    }
  }
}
