/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class CoreCopyTests {
  private static readonly PACKAGE_NAME: string = "@noldova/context.core";
  private static readonly PACKAGE_FOLDER: string = fileURLToPath(new URL("../", import.meta.resolve("@noldova/context.core")));
  private static readonly TEMPORARY_FOLDER: string = "temporary";
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

      Assert.areEqual(CoreCopyTests.COPIES_LOADED, await CoreCopyTests.runAsync(scriptPath, directory, directory));
    });
  }

  @TestMethod
  public refusesToLoadBesideACopyFromBeforeTheCheckAsync(): Promise<void> {
    return CoreCopyTests.withDirectoryAsync(async directory => {
      const scriptPath = join(directory, "load.js");
      await writeFile(scriptPath, CoreCopyTests.loadingScript(
        "Object.defineProperty(Object, \"isFunction\", { value: () => true, writable: false, enumerable: false, configurable: false });",
        `await import("${CoreCopyTests.PACKAGE_NAME}");`));

      Assert.areEqual(CoreCopyTests.COPIES_LOADED, await CoreCopyTests.runAsync(scriptPath, directory, directory));
    });
  }

  @TestMethod
  public refusesTwoCopiesNpmInstallsSideBySideAsync(): Promise<void> {
    return CoreCopyTests.withDirectoryAsync(async directory => {
      const dependent = join(directory, "dependent");
      await cp(CoreCopyTests.PACKAGE_FOLDER, join(dependent, "node_modules", "@noldova", "context.core"), { recursive: true });
      await writeFile(join(dependent, "package.json"), JSON.stringify({
        name: "dependent",
        version: "1.0.0",
        type: "module",
        main: "index.js",
        dependencies: { [CoreCopyTests.PACKAGE_NAME]: "*" },
        bundleDependencies: [CoreCopyTests.PACKAGE_NAME]
      }));
      await writeFile(join(dependent, "index.js"), `import "${CoreCopyTests.PACKAGE_NAME}";\n`);
      const packed = await CoreCopyTests.runNpmAsync(["pack", "--silent", "--pack-destination", directory, dependent, CoreCopyTests.PACKAGE_FOLDER], directory, directory);
      const [dependentArchive = "", coreArchive = ""] = packed.trim().split(/\s+/u);

      const app = join(directory, "app");
      await mkdir(app);
      await writeFile(join(app, "package.json"), JSON.stringify({
        name: "app",
        private: true,
        type: "module",
        dependencies: { [CoreCopyTests.PACKAGE_NAME]: `file:../${coreArchive}`, dependent: `file:../${dependentArchive}` }
      }));
      await CoreCopyTests.runNpmAsync(["install", "--offline", "--no-audit", "--no-fund", "--ignore-scripts", "--no-package-lock"], app, directory);
      const scriptPath = join(app, "main.js");
      await writeFile(scriptPath, CoreCopyTests.loadingScript(`await import("${CoreCopyTests.PACKAGE_NAME}");`, "await import(\"dependent\");"));

      Assert.areEqual(CoreCopyTests.COPIES_LOADED, await CoreCopyTests.runAsync(scriptPath, app, directory));
    });
  }

  private static async withDirectoryAsync(action: (directory: string) => Promise<void>): Promise<void> {
    const directory = await mkdtemp(resolve(import.meta.dirname, "../../../core-copies-"));
    try {
      await mkdir(join(directory, CoreCopyTests.TEMPORARY_FOLDER));
      await action(directory);
    }
    finally {
      await rm(directory, { recursive: true, force: true });
    }
  }

  /** A module that runs the first step, then loads the second, and writes the message of the error it ends with, or nothing. */
  private static loadingScript(first: string, second: string): string {
    return `try {\n  ${first}\n  ${second}\n}\ncatch (error) {\n  process.stdout.write(error.message);\n}\n`;
  }

  private static async runAsync(scriptPath: string, directory: string, root: string): Promise<string> {
    const { stdout } = await promisify(execFile)(process.execPath, [scriptPath], { cwd: directory, env: CoreCopyTests.environment(root), windowsHide: true });

    return stdout;
  }

  private static async runNpmAsync(values: readonly string[], directory: string, root: string): Promise<string> {
    const npmPath = process.env["npm_execpath"];
    Assert.isDefined(npmPath, "The suite runs through npm, which names its own path in npm_execpath.");
    const { stdout } = await promisify(execFile)(process.execPath, [npmPath, ...values], { cwd: directory, env: CoreCopyTests.environment(root), windowsHide: true });

    return stdout;
  }

  /**
   * The children's environment, with a temporary folder of their own under the test's folder, which the test removes: npm turns on Node's
   * compile cache, which would otherwise write into the run's temporary folder, and the suite requires that folder left clean.
   */
  private static environment(root: string): NodeJS.ProcessEnv {
    const temporary = join(root, CoreCopyTests.TEMPORARY_FOLDER);

    return { ...process.env, TMPDIR: temporary, TMP: temporary, TEMP: temporary };
  }
}
