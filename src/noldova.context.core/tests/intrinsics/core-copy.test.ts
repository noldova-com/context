/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { execFile } from "node:child_process";
import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

// The copy npm installs beside another is tested with exceptions' packed-install tests, which install packages with npm.
@TestClass
export class CoreCopyTests {
  private static readonly PACKAGE_NAME: string = "@noldova/context.core";
  private static readonly PACKAGE_FOLDER: string = fileURLToPath(new URL("../", import.meta.resolve("@noldova/context.core")));
  private static readonly COPIES_LOADED: string =
    "Two copies of @noldova/context.core are loaded, so this one cannot add its extensions. The app's packages need one context version that each of their ranges meets; npm ls @noldova/context.core names the packages that bring each copy.";

  @TestMethod
  public refusesASecondCopyAsync(): Promise<void> {
    return CoreCopyTests.withDirectoryAsync(async directory => {
      const copy = join(directory, "copy");
      await cp(CoreCopyTests.PACKAGE_FOLDER, copy, { recursive: true });
      const scriptPath = join(directory, "load.js");
      await writeFile(scriptPath, CoreCopyTests.loadingScript(
        `await import(${JSON.stringify(pathToFileURL(join(copy, "api", "index.js")).href)});`,
        `await import("${CoreCopyTests.PACKAGE_NAME}");`));

      Assert.areEqual(CoreCopyTests.COPIES_LOADED, await CoreCopyTests.runAsync(scriptPath, directory));
    });
  }

  @TestMethod
  public refusesToLoadBesideACopyFromBeforeTheCheckAsync(): Promise<void> {
    return CoreCopyTests.withDirectoryAsync(async directory => {
      const scriptPath = join(directory, "load.js");
      await writeFile(scriptPath, CoreCopyTests.loadingScript(
        "Object.defineProperty(Object, \"isFunction\", { value: () => true, writable: false, enumerable: false, configurable: false });",
        `await import("${CoreCopyTests.PACKAGE_NAME}");`));

      Assert.areEqual(CoreCopyTests.COPIES_LOADED, await CoreCopyTests.runAsync(scriptPath, directory));
    });
  }

  private static async withDirectoryAsync(action: (directory: string) => Promise<void>): Promise<void> {
    const directory = await mkdtemp(resolve(import.meta.dirname, "../../../core-copies-"));
    try {
      await action(directory);
    }
    finally {
      await rm(directory, { recursive: true, force: true });
    }
  }

  // A module that runs the first step, then loads the second, and writes the message of the error it ends with, or nothing.
  private static loadingScript(first: string, second: string): string {
    return `try {\n  ${first}\n  ${second}\n}\ncatch (error) {\n  process.stdout.write(error.message);\n}\n`;
  }

  // Runs the script with the test's folder as its temporary folder, which the test removes, so anything the child writes there, such as a
  // compile cache, goes with it: the suite requires the run's temporary folder left clean.
  private static async runAsync(scriptPath: string, directory: string): Promise<string> {
    const { stdout } = await promisify(execFile)(process.execPath, [scriptPath], {
      cwd: directory,
      env: { ...process.env, TMPDIR: directory, TMP: directory, TEMP: directory },
      windowsHide: true
    });

    return stdout;
  }
}
