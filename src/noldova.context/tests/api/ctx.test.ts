/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { ProjectFolder } from "../fixtures/project-folder.fixture.js";

@TestClass
export class CtxTests {
  private static readonly ENTRY_URL: string = import.meta.resolve("@noldova/context/api/ctx.js");

  @TestMethod
  public runsTheHostWithTheProcessArgumentsAsync(): Promise<void> {
    return ProjectFolder.useAsync(async folder => {
      await folder.writeProjectAsync({ name: "noldova.context.app", kind: "library", sdk: "noldova.context.testsdk" });
      await folder.writeProviderAsync("noldova.context.testsdk", ProjectFolder.command("BuildCommand", "build", 3));

      const written = await CtxTests.runAsync(folder.directory, ["build", "x"], "own", 3);

      Assert.areEqual("noldova.context.app x\n", written);
    });
  }

  @TestMethod
  public handsTheCommandToTheHostInstalledForTheFolderAsync(): Promise<void> {
    return ProjectFolder.useAsync(async folder => {
      await folder.writeHostAsync("process.stdout.write(`project host: ${process.argv.slice(2).join(\" \")}\n`);\nprocess.exitCode = 5;\n");

      const written = await CtxTests.runAsync(folder.directory, ["build", "x"], "forwarded", 5);

      Assert.areEqual("project host: build x\n", written);
    });
  }

  private static async runAsync(directory: string, arguments_: readonly string[], run: string, expectedExitCode: number): Promise<string> {
    const argv = process.argv;
    const cwd = process.cwd;
    const exitCode = process.exitCode;
    const write = process.stdout.write;
    const written: string[] = [];
    process.argv = [process.execPath, "ctx", ...arguments_];
    process.cwd = (): string => directory;
    process.stdout.write = (chunk: string | Uint8Array): boolean => written.push(String(chunk)) > 0;
    try {
      await import(`${CtxTests.ENTRY_URL}?${run}`);

      Assert.areEqual(expectedExitCode, process.exitCode);
    }
    finally {
      process.stdout.write = write;
      process.cwd = cwd;
      process.argv = argv;
      process.exitCode = exitCode;
    }

    return written.join("");
  }
}
