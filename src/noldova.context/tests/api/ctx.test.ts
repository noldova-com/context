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
  @TestMethod
  public runsTheHostWithTheProcessArgumentsAsync(): Promise<void> {
    return ProjectFolder.useAsync(async folder => {
      const manifestPath = await folder.writeProjectAsync({ name: "noldova.context.app", kind: "library", sdk: "noldova.context.testsdk" });
      await folder.writeProviderAsync("noldova.context.testsdk", ProjectFolder.command("BuildCommand", "build", 3));
      const argv = process.argv;
      const exitCode = process.exitCode;
      const write = process.stdout.write;
      const written: string[] = [];
      process.argv = [process.execPath, "ctx", "build", "--project", manifestPath, "x"];
      process.stdout.write = (chunk: string | Uint8Array): boolean => written.push(String(chunk)) > 0;
      try {
        await import("@noldova/context/api/ctx.js");

        Assert.areEqual(3, process.exitCode);
      }
      finally {
        process.stdout.write = write;
        process.argv = argv;
        process.exitCode = exitCode;
      }

      Assert.areEqual("noldova.context.app x\n", written.join(""));
    });
  }
}
