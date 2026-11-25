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
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { PackedArchives } from "../fixtures/packed-archives.fixture.js";

@TestClass
export class PackedInstallTests {
  private static readonly CORE_NAME: string = "@noldova/context.core";
  private static readonly EXCEPTIONS_NAME: string = "@noldova/context.exceptions";
  private static readonly CORE_FOLDER: string = fileURLToPath(new URL("../", import.meta.resolve("@noldova/context.core")));
  private static readonly EXCEPTIONS_FOLDER: string = fileURLToPath(new URL("../", import.meta.resolve("@noldova/context.exceptions")));
  private static readonly INSTALL_VALUES: readonly string[] = ["install", "--offline", "--no-audit", "--no-fund", "--ignore-scripts", "--no-package-lock"];
  private static readonly CORE_RANGE: RegExp = /"@noldova\/context\.core": ">=(\d+)\.(\d+)\.(\d+) <([^"]+)"/u;
  private static readonly VERSION_FIELD: RegExp = /"version": "[^"]+"/u;
  private static readonly TEMPORARY_FOLDER: string = "temporary";
  private static readonly COPIES_LOADED: string =
    "Two copies of @noldova/context.core are loaded, so this one cannot add its extensions. The app's packages need one context version that each of their ranges meets; npm ls @noldova/context.core names the packages that bring each copy.";

  @TestMethod
  public sharesOneCoreAtAnotherVersionInItsRangeAsync(): Promise<void> {
    return PackedInstallTests.withDirectoryAsync(async directory => {
      const app = await PackedInstallTests.createExceptionsAppAsync(directory, await PackedInstallTests.readCoreVersionInRangeAsync());

      await PackedInstallTests.runNpmAsync(PackedInstallTests.INSTALL_VALUES, app, directory);
      const scriptPath = join(app, "main.js");
      await writeFile(scriptPath, `import "${PackedInstallTests.CORE_NAME}";\nimport "${PackedInstallTests.EXCEPTIONS_NAME}";\nprocess.stdout.write("loaded");\n`);

      Assert.areEqual("loaded", await PackedInstallTests.runAsync(scriptPath, app, directory));
      Assert.isFalse(existsSync(join(app, "node_modules", "@noldova", "context.exceptions", "node_modules")));
    });
  }

  @TestMethod
  public refusesToInstallACoreOutsideItsRangeAsync(): Promise<void> {
    return PackedInstallTests.withDirectoryAsync(async directory => {
      const app = await PackedInstallTests.createExceptionsAppAsync(directory, await PackedInstallTests.readCoreVersionPastRangeAsync());

      const failure = await Assert.throwsAsync(() => PackedInstallTests.runNpmAsync(PackedInstallTests.INSTALL_VALUES, app, directory), Error);

      Assert.isTrue(failure.message.includes("ERESOLVE"), failure.message);
      Assert.isFalse(existsSync(join(app, "node_modules", "@noldova", "context.exceptions")));
    });
  }

  @TestMethod
  public refusesTwoCoresNpmInstallsSideBySideAsync(): Promise<void> {
    return PackedInstallTests.withDirectoryAsync(async directory => {
      const dependent = join(directory, "dependent");
      await cp(PackedInstallTests.CORE_FOLDER, join(dependent, "node_modules", "@noldova", "context.core"), { recursive: true });
      await writeFile(join(dependent, "package.json"), JSON.stringify({
        name: "dependent",
        version: "1.0.0",
        type: "module",
        main: "index.js",
        dependencies: { [PackedInstallTests.CORE_NAME]: "*" },
        bundleDependencies: [PackedInstallTests.CORE_NAME]
      }));
      await writeFile(join(dependent, "index.js"), `import "${PackedInstallTests.CORE_NAME}";\n`);
      const archives = await PackedInstallTests.packAsync(directory, dependent, PackedInstallTests.CORE_FOLDER);

      const app = await PackedInstallTests.createAppAsync(directory, { [PackedInstallTests.CORE_NAME]: `file:../${archives.second}`, dependent: `file:../${archives.first}` });
      await PackedInstallTests.runNpmAsync(PackedInstallTests.INSTALL_VALUES, app, directory);
      const scriptPath = join(app, "main.js");
      await writeFile(scriptPath, PackedInstallTests.loadingScript(`await import("${PackedInstallTests.CORE_NAME}");`, "await import(\"dependent\");"));

      Assert.areEqual(PackedInstallTests.COPIES_LOADED, await PackedInstallTests.runAsync(scriptPath, app, directory));
    });
  }

  @TestMethod
  public refusesASecondCopyAsync(): Promise<void> {
    return PackedInstallTests.withDirectoryAsync(async directory => {
      const copy = join(directory, "copy");
      await cp(PackedInstallTests.CORE_FOLDER, copy, { recursive: true });
      const scriptPath = join(directory, "load.js");
      await writeFile(scriptPath, PackedInstallTests.loadingScript(
        `await import(${JSON.stringify(pathToFileURL(join(copy, "api", "index.js")).href)});`,
        `await import("${PackedInstallTests.CORE_NAME}");`));

      Assert.areEqual(PackedInstallTests.COPIES_LOADED, await PackedInstallTests.runAsync(scriptPath, directory, directory));
    });
  }

  @TestMethod
  public refusesToLoadBesideACopyFromBeforeTheCheckAsync(): Promise<void> {
    return PackedInstallTests.withDirectoryAsync(async directory => {
      const scriptPath = join(directory, "load.js");
      await writeFile(scriptPath, PackedInstallTests.loadingScript(
        "Object.defineProperty(Object, \"isFunction\", { value: () => true, writable: false, enumerable: false, configurable: false });",
        `await import("${PackedInstallTests.CORE_NAME}");`));

      Assert.areEqual(PackedInstallTests.COPIES_LOADED, await PackedInstallTests.runAsync(scriptPath, directory, directory));
    });
  }

  private static loadingScript(first: string, second: string): string {
    return `try {\n  ${first}\n  ${second}\n}\ncatch (exception) {\n  process.stdout.write(exception.message);\n}\n`;
  }

  private static async readCoreVersionInRangeAsync(): Promise<string> {
    const range = await PackedInstallTests.readCoreRangeAsync();

    return `${range[1]}.${range[2]}.${Number(range[3]) + 1}`;
  }

  private static async readCoreVersionPastRangeAsync(): Promise<string> {
    const range = await PackedInstallTests.readCoreRangeAsync();

    return String(range[4]);
  }

  private static async readCoreRangeAsync(): Promise<RegExpExecArray> {
    const manifest = await readFile(join(PackedInstallTests.EXCEPTIONS_FOLDER, "package.json"), "utf8");
    const range = PackedInstallTests.CORE_RANGE.exec(manifest);
    Assert.isNotNull(range, manifest);

    return range;
  }

  private static async createExceptionsAppAsync(directory: string, coreVersion: string): Promise<string> {
    const core = join(directory, "core");
    await cp(PackedInstallTests.CORE_FOLDER, core, { recursive: true });
    const coreManifest = join(core, "package.json");
    await writeFile(coreManifest, (await readFile(coreManifest, "utf8")).replace(PackedInstallTests.VERSION_FIELD, `"version": "${coreVersion}"`));
    const archives = await PackedInstallTests.packAsync(directory, core, PackedInstallTests.EXCEPTIONS_FOLDER);

    return PackedInstallTests.createAppAsync(directory, {
      [PackedInstallTests.CORE_NAME]: `file:../${archives.first}`,
      [PackedInstallTests.EXCEPTIONS_NAME]: `file:../${archives.second}`
    });
  }

  private static async createAppAsync(directory: string, dependencies: Readonly<Record<string, string>>): Promise<string> {
    const app = join(directory, "app");
    await mkdir(app);
    await writeFile(join(app, "package.json"), JSON.stringify({ name: "app", private: true, type: "module", dependencies }));

    return app;
  }

  private static async packAsync(directory: string, first: string, second: string): Promise<PackedArchives> {
    const packed = await PackedInstallTests.runNpmAsync(["pack", "--silent", "--pack-destination", directory, first, second], directory, directory);
    const [firstArchive, secondArchive, ...others] = packed.trim().split(/\s+/u);
    Assert.isDefined(firstArchive, packed);
    Assert.isDefined(secondArchive, packed);
    Assert.areEqual(0, others.length, packed);

    return new PackedArchives(firstArchive, secondArchive);
  }

  private static async withDirectoryAsync(action: (directory: string) => Promise<void>): Promise<void> {
    const directory = await mkdtemp(resolve(import.meta.dirname, "../../../packed-install-"));
    try {
      await mkdir(join(directory, PackedInstallTests.TEMPORARY_FOLDER));
      await action(directory);
    }
    finally {
      await rm(directory, { recursive: true, force: true });
    }
  }

  private static async runAsync(scriptPath: string, directory: string, root: string): Promise<string> {
    const { stdout } = await promisify(execFile)(process.execPath, [scriptPath],
      { cwd: directory, env: PackedInstallTests.environmentWithItsOwnTemporaryFolder(root), windowsHide: true });

    return stdout;
  }

  private static async runNpmAsync(values: readonly string[], directory: string, root: string): Promise<string> {
    const npmPath = process.env["npm_execpath"];
    Assert.isDefined(npmPath, "The suite runs through npm, which names its own path in npm_execpath.");
    const { stdout } = await promisify(execFile)(process.execPath, [npmPath, ...values],
      { cwd: directory, env: PackedInstallTests.environmentWithItsOwnTemporaryFolder(root), windowsHide: true });

    return stdout;
  }

  private static environmentWithItsOwnTemporaryFolder(root: string): NodeJS.ProcessEnv {
    const temporary = join(root, PackedInstallTests.TEMPORARY_FOLDER);

    return { ...process.env, TMPDIR: temporary, TMP: temporary, TEMP: temporary };
  }
}
