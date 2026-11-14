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
  private static readonly PACKAGE_FOLDER: URL = new URL("../", import.meta.resolve("@noldova/context.core"));

  @TestMethod
  public recordsTheFolderOfTheCopyItLoaded(): void {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, Symbol.for(CoreCopyTests.PACKAGE_NAME));

    Assert.isDefined(descriptor);
    Assert.areEqual(CoreCopyTests.PACKAGE_FOLDER.href, descriptor.value);
    Assert.isFalse(descriptor.writable ?? true);
    Assert.isFalse(descriptor.configurable ?? true);
  }

  @TestMethod
  public refusesASecondCopyNamingBothFoldersAsync(): Promise<void> {
    return CoreCopyTests.withDirectoryAsync(async directory => {
      const copy = join(directory, "copy");
      await cp(fileURLToPath(CoreCopyTests.PACKAGE_FOLDER), copy, { recursive: true });
      const scriptPath = join(directory, "load.js");
      await writeFile(scriptPath, CoreCopyTests.loadingScript(
        `await import(${JSON.stringify(pathToFileURL(join(copy, "api", "index.js")).href)});`,
        `await import("${CoreCopyTests.PACKAGE_NAME}");`));

      const output = await CoreCopyTests.runAsync(scriptPath, directory);

      Assert.areEqual(
        `Two copies of @noldova/context.core are loaded, from ${pathToFileURL(copy).href}/ and ${CoreCopyTests.PACKAGE_FOLDER.href}. An app loads one copy; npm ls @noldova/context.core names the packages that bring each.`,
        output);
    });
  }

  @TestMethod
  public refusesToLoadBesideAnOlderCopyAsync(): Promise<void> {
    return CoreCopyTests.withDirectoryAsync(async directory => {
      const scriptPath = join(directory, "load.js");
      await writeFile(scriptPath, CoreCopyTests.loadingScript(
        "Object.defineProperty(Object, \"isFunction\", { value: () => true, writable: false, enumerable: false, configurable: false });",
        `await import("${CoreCopyTests.PACKAGE_NAME}");`));

      const output = await CoreCopyTests.runAsync(scriptPath, directory);

      Assert.areEqual(
        `A copy of @noldova/context.core older than this check is already loaded, so this copy, from ${CoreCopyTests.PACKAGE_FOLDER.href}, cannot add its extensions beside it. An app loads one copy; npm ls @noldova/context.core names the packages that bring each.`,
        output);
    });
  }

  @TestMethod
  public refusesTwoCopiesNpmInstallsSideBySideAsync(): Promise<void> {
    return CoreCopyTests.withDirectoryAsync(async directory => {
      const npmPath = process.env["npm_execpath"];
      Assert.isDefined(npmPath, "The suite runs through npm, which names its own path in npm_execpath.");

      const dependent = join(directory, "dependent");
      await cp(fileURLToPath(CoreCopyTests.PACKAGE_FOLDER), join(dependent, "node_modules", "@noldova", "context.core"), { recursive: true });
      await writeFile(join(dependent, "package.json"), JSON.stringify({
        name: "dependent",
        version: "1.0.0",
        type: "module",
        main: "index.js",
        dependencies: { [CoreCopyTests.PACKAGE_NAME]: "*" },
        bundleDependencies: [CoreCopyTests.PACKAGE_NAME]
      }));
      await writeFile(join(dependent, "index.js"), `import "${CoreCopyTests.PACKAGE_NAME}";\n`);
      await CoreCopyTests.runNpmAsync(npmPath, ["pack", "--silent", "--pack-destination", directory], dependent);
      const coreArchive = (await CoreCopyTests.runNpmAsync(npmPath, ["pack", "--silent", "--pack-destination", directory, fileURLToPath(CoreCopyTests.PACKAGE_FOLDER)], directory)).trim();

      const app = join(directory, "app");
      await mkdir(app);
      await writeFile(join(app, "package.json"), JSON.stringify({
        name: "app",
        private: true,
        type: "module",
        dependencies: { [CoreCopyTests.PACKAGE_NAME]: `file:../${coreArchive}`, dependent: "file:../dependent-1.0.0.tgz" }
      }));
      await CoreCopyTests.runNpmAsync(npmPath, ["install", "--offline", "--no-audit", "--no-fund", "--ignore-scripts", "--no-package-lock"], app);
      const scriptPath = join(app, "main.js");
      await writeFile(scriptPath, CoreCopyTests.loadingScript(`await import("${CoreCopyTests.PACKAGE_NAME}");`, "await import(\"dependent\");"));

      const output = await CoreCopyTests.runAsync(scriptPath, app);

      const installed = join(app, "node_modules", "@noldova", "context.core");
      const nested = join(app, "node_modules", "dependent", "node_modules", "@noldova", "context.core");
      Assert.areEqual(
        `Two copies of @noldova/context.core are loaded, from ${pathToFileURL(installed).href}/ and ${pathToFileURL(nested).href}/. An app loads one copy; npm ls @noldova/context.core names the packages that bring each.`,
        output);
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

  /** A module that runs the first step, then loads the second, and writes the message of the error it ends with, or nothing. */
  private static loadingScript(first: string, second: string): string {
    return `try {\n  ${first}\n  ${second}\n}\ncatch (error) {\n  process.stdout.write(error.message);\n}\n`;
  }

  private static async runAsync(scriptPath: string, directory: string): Promise<string> {
    const { stdout } = await promisify(execFile)(process.execPath, [scriptPath], { cwd: directory, windowsHide: true });

    return stdout;
  }

  private static async runNpmAsync(npmPath: string, values: readonly string[], directory: string): Promise<string> {
    const { stdout } = await promisify(execFile)(process.execPath, [npmPath, ...values], { cwd: directory, windowsHide: true });

    return stdout;
  }
}
