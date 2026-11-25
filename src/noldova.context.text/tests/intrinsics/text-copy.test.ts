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

@TestClass
export class TextCopyTests {
  private static readonly TEXT_ENTRY: string = import.meta.resolve("@noldova/context.text");
  private static readonly TEXT_FOLDER: string = fileURLToPath(new URL("../", TextCopyTests.TEXT_ENTRY));
  private static readonly COPIES_LOADED: string =
    "Two copies of @noldova/context.text are loaded, so this one cannot add its extensions. The app's packages need one context version that each of their ranges meets; npm ls @noldova/context.text names the packages that bring each copy.";

  @TestMethod
  public refusesASecondCopyAsync(): Promise<void> {
    return TextCopyTests.withDirectoryAsync(async directory => {
      const copy = join(directory, "copy");
      await cp(TextCopyTests.TEXT_FOLDER, copy, { recursive: true });

      const output = await TextCopyTests.runAsync(directory,
        `await import(${JSON.stringify(pathToFileURL(join(copy, "api", "index.js")).href)});`,
        `await import(${JSON.stringify(TextCopyTests.TEXT_ENTRY)});`);

      Assert.areEqual(TextCopyTests.COPIES_LOADED, output);
    });
  }

  @TestMethod
  public refusesToLoadBesideACopyFromBeforeTheCheckAsync(): Promise<void> {
    return TextCopyTests.withDirectoryAsync(async directory => {
      const output = await TextCopyTests.runAsync(directory,
        "Object.defineProperty(String, \"isAsciiBinaryDigit\", { value: () => true, writable: false, enumerable: false, configurable: false });",
        `await import(${JSON.stringify(TextCopyTests.TEXT_ENTRY)});`);

      Assert.areEqual(TextCopyTests.COPIES_LOADED, output);
    });
  }

  @TestMethod
  public loadsOnceAsync(): Promise<void> {
    return TextCopyTests.withDirectoryAsync(async directory => {
      const output = await TextCopyTests.runAsync(directory,
        `await import(${JSON.stringify(TextCopyTests.TEXT_ENTRY)});`,
        "process.stdout.write(String(String.isAsciiBinaryDigit(\"1\")));");

      Assert.areEqual("true", output);
    });
  }

  private static async withDirectoryAsync(action: (directory: string) => Promise<void>): Promise<void> {
    const directory = await mkdtemp(resolve(import.meta.dirname, "../../../text-copy-"));
    try {
      await action(directory);
    }
    finally {
      await rm(directory, { recursive: true, force: true });
    }
  }

  private static async runAsync(directory: string, first: string, second: string): Promise<string> {
    const scriptPath = join(directory, "load.js");
    await writeFile(scriptPath, `try {\n  ${first}\n  ${second}\n}\ncatch (exception) {\n  process.stdout.write(exception.message);\n}\n`);
    const { stdout } = await promisify(execFile)(process.execPath, [scriptPath], { cwd: directory, windowsHide: true });

    return stdout;
  }
}
