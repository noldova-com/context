/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import * as api from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ExceptionsApiTests {
  private static readonly INSTALL_VALUES: readonly string[] = ["install", "--offline", "--no-audit", "--no-fund", "--ignore-scripts", "--no-package-lock"];
  private static readonly CORE_RANGE: RegExp = /"@noldova\/context\.core": ">=(\d+)\.(\d+)\.(\d+) <([^"]+)"/u;
  private static readonly VERSION_FIELD: RegExp = /"version": "[^"]+"/u;

  @TestMethod
  public exportsTheCompleteCatalog(): void {
    const exportNames = [
      "ArgumentException",
      "ArgumentNullException",
      "ArgumentOutOfRangeException",
      "Exception",
      "ExceptionOptions",
      "IndexOutOfRangeException"
    ];

    Assert.areEqual(exportNames.sort().join(","), Object.keys(api).sort().join(","));
  }

  @TestMethod
  public keepsTheHierarchyRootedInError(): void {
    Assert.isInstanceOf(api.ArgumentNullException.prototype, api.ArgumentException);
    Assert.isInstanceOf(api.ArgumentOutOfRangeException.prototype, api.ArgumentException);
    Assert.isInstanceOf(api.ArgumentException.prototype, api.Exception);
    Assert.isInstanceOf(api.IndexOutOfRangeException.prototype, api.Exception);
    Assert.isInstanceOf(api.Exception.prototype, Error);
  }

  @TestMethod
  public async exposesDependencyAugmentationsInAnIsolatedConsumerAsync(): Promise<void> {
    const directory = await mkdtemp(resolve(import.meta.dirname, "../../../consumer-"));
    try {
      const consumerPath = join(directory, "consumer.ts");
      await writeFile(consumerPath, `
        import "@noldova/context.exceptions";

        const empty: string = String.empty;
        const formatted: string = String.format("{0}", "value");
        const isUndefined: boolean = Object.isUndefined(undefined);
        if (empty !== "" || formatted !== "value" || !isUndefined)
          throw new Error("Core augmentations were not loaded.");
      `);
      const configurationPath = join(directory, "tsconfig.json");
      await writeFile(configurationPath, JSON.stringify({
        extends: resolve(import.meta.dirname, "../../../../tsconfig-base.json"),
        compilerOptions: { noEmit: true, types: [] },
        files: ["consumer.ts"],
        include: []
      }));

      const compilerPath = fileURLToPath(new URL("./bin/tsc", import.meta.resolve("typescript/package.json")));
      await promisify(execFile)(process.execPath, [compilerPath, "--project", configurationPath], { windowsHide: true });
      await promisify(execFile)(process.execPath, [consumerPath], { windowsHide: true });
    }
    finally {
      await rm(directory, { recursive: true, force: true });
    }
  }

  @TestMethod
  public async sharesOneCoreAtAnotherVersionInItsRangeAsync(): Promise<void> {
    const directory = await mkdtemp(resolve(import.meta.dirname, "../../../peer-range-"));
    try {
      const app = await ExceptionsApiTests.createAppAsync(directory, await ExceptionsApiTests.readCoreVersionInRangeAsync());

      await ExceptionsApiTests.runNpmAsync(ExceptionsApiTests.INSTALL_VALUES, app);
      const scriptPath = join(app, "main.js");
      await writeFile(scriptPath, "import \"@noldova/context.core\";\nimport \"@noldova/context.exceptions\";\nprocess.stdout.write(\"loaded\");\n");
      const { stdout } = await promisify(execFile)(process.execPath, [scriptPath], { cwd: app, windowsHide: true });

      Assert.areEqual("loaded", stdout);
      Assert.isFalse(existsSync(join(app, "node_modules", "@noldova", "context.exceptions", "node_modules")));
    }
    finally {
      await rm(directory, { recursive: true, force: true });
    }
  }

  @TestMethod
  public async refusesToInstallACoreOutsideItsRangeAsync(): Promise<void> {
    const directory = await mkdtemp(resolve(import.meta.dirname, "../../../peer-range-"));
    try {
      const app = await ExceptionsApiTests.createAppAsync(directory, await ExceptionsApiTests.readCoreVersionPastRangeAsync());

      const failure = await Assert.throwsAsync(() => ExceptionsApiTests.runNpmAsync(ExceptionsApiTests.INSTALL_VALUES, app), Error);

      Assert.isTrue(failure.message.includes("ERESOLVE"), failure.message);
      Assert.isFalse(existsSync(join(app, "node_modules", "@noldova", "context.exceptions")));
    }
    finally {
      await rm(directory, { recursive: true, force: true });
    }
  }

  /** A core version inside the range the installed package takes core in, a patch above its lower bound. */
  private static async readCoreVersionInRangeAsync(): Promise<string> {
    const range = await ExceptionsApiTests.readCoreRangeAsync();

    return `${range[1]}.${range[2]}.${Number(range[3]) + 1}`;
  }

  /** The first core version past that range: its upper bound. */
  private static async readCoreVersionPastRangeAsync(): Promise<string> {
    const range = await ExceptionsApiTests.readCoreRangeAsync();

    return String(range[4]);
  }

  /** The installed package's peer range of core, from its manifest: the lower bound's three numbers, then the upper bound. */
  private static async readCoreRangeAsync(): Promise<RegExpExecArray> {
    const manifest = await readFile(fileURLToPath(new URL("../package.json", import.meta.resolve("@noldova/context.exceptions"))), "utf8");
    const range = ExceptionsApiTests.CORE_RANGE.exec(manifest);
    Assert.isNotNull(range, manifest);

    return range;
  }

  /** An app that installs the package and a copy of core at the version given, each from a tarball, and returns the app's folder. */
  private static async createAppAsync(directory: string, coreVersion: string): Promise<string> {
    const core = join(directory, "core");
    await cp(fileURLToPath(new URL("../", import.meta.resolve("@noldova/context.core"))), core, { recursive: true });
    const coreManifest = join(core, "package.json");
    await writeFile(coreManifest, (await readFile(coreManifest, "utf8")).replace(ExceptionsApiTests.VERSION_FIELD, `"version": "${coreVersion}"`));
    const coreArchive = (await ExceptionsApiTests.runNpmAsync(["pack", "--silent", "--pack-destination", directory, core], directory)).trim();
    const exceptionsArchive = (await ExceptionsApiTests.runNpmAsync(
      ["pack", "--silent", "--pack-destination", directory, fileURLToPath(new URL("../", import.meta.resolve("@noldova/context.exceptions")))],
      directory)).trim();

    const app = join(directory, "app");
    await mkdir(app);
    await writeFile(join(app, "package.json"), JSON.stringify({
      name: "app",
      private: true,
      type: "module",
      dependencies: { "@noldova/context.core": `file:../${coreArchive}`, "@noldova/context.exceptions": `file:../${exceptionsArchive}` }
    }));
    return app;
  }

  private static async runNpmAsync(values: readonly string[], directory: string): Promise<string> {
    const npmPath = process.env["npm_execpath"];
    Assert.isDefined(npmPath, "The suite runs through npm, which names its own path in npm_execpath.");
    // npm turns on Node's compile cache, which writes into the run's temporary folder; the suite requires that folder left clean.
    const { stdout } = await promisify(execFile)(process.execPath, [npmPath, ...values], { cwd: directory, env: { ...process.env, NODE_DISABLE_COMPILE_CACHE: "1" }, windowsHide: true });

    return stdout;
  }
}
