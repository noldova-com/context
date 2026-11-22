/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ScriptRunner } from "./fixtures/script-runner.fixture.js";

@TestClass
export class ConfigTests {
  private static readonly DIRECTORY_PREFIX: string = "noldova-config-";
  private static readonly DRIVER: string = `
    const [scriptsUrl] = process.argv.slice(1);
    const { default: CommandFailedException } = await import(new URL("command-failed.exception.ts", scriptsUrl).href);
    try {
      const { default: Config } = await import(new URL("config.ts", scriptsUrl).href);
      console.log(Config.UPPER_BOUND);
    }
    catch (error) {
      if (!(error instanceof CommandFailedException))
        throw error;
      console.log(error.message);
    }
  `;
  private static readonly REMOVAL_RETRIES: number = 5;
  private static readonly SCRIPT_FILE_NAMES: readonly string[] = ["command-failed.exception.ts", "config.ts", "package-info.ts"];
  private static readonly SCRIPTS_FOLDER_NAME: string = "scripts";
  private static readonly VERSION_FILE_NAME: string = "version.json";

  @TestData("0.0.9", "0.1.0")
  @TestData("0.3.1", "0.4.0")
  @TestData("1.4.2", "2.0.0")
  @TestData("12.0.7", "13.0.0")
  @TestMethod
  public async boundsPeerRangesByTheNextMinorBeforeOneAndTheNextMajorFromOneAsync(version: string, upperBound: string): Promise<void> {
    Assert.areEqual(upperBound, await ConfigTests.readUpperBoundAsync(version));
  }

  @TestData("1.2")
  @TestData("01.2.3")
  @TestData("1.2.3-beta")
  @TestMethod
  public async refusesAVersionThatIsNotThreeNumbersAsync(version: string): Promise<void> {
    const output = await ConfigTests.readUpperBoundAsync(version);

    Assert.isTrue(output.endsWith(`${ConfigTests.VERSION_FILE_NAME} holds "${version}", not a version of three numbers such as 0.0.4.`), output);
  }

  private static async readUpperBoundAsync(version: string): Promise<string> {
    const directory = await mkdtemp(path.join(tmpdir(), ConfigTests.DIRECTORY_PREFIX));
    try {
      const scriptsFolder = path.join(directory, ConfigTests.SCRIPTS_FOLDER_NAME);
      await mkdir(scriptsFolder);
      for (const name of ConfigTests.SCRIPT_FILE_NAMES)
        await copyFile(path.join(ScriptRunner.SCRIPTS_FOLDER, name), path.join(scriptsFolder, name));
      await writeFile(path.join(directory, ConfigTests.VERSION_FILE_NAME), JSON.stringify({ version }));

      return await ScriptRunner.runAsync(ConfigTests.DRIVER, scriptsFolder, []);
    }
    finally {
      await rm(directory, { recursive: true, force: true, maxRetries: ConfigTests.REMOVAL_RETRIES });
    }
  }
}
