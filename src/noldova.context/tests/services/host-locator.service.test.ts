/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import "@noldova/context.core";
import { HostLocatorService } from "@noldova/context/services/host-locator.service.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { ProjectFolder } from "../fixtures/project-folder.fixture.js";

@TestClass
export class HostLocatorServiceTests {
  private static readonly OWN_ENTRY_PATH: string = fileURLToPath(import.meta.resolve("@noldova/context/api/ctx.js"));

  @TestMethod
  public findsTheHostInstalledForTheFolderAsync(): Promise<void> {
    return ProjectFolder.useAsync(async folder => {
      const entryPath = await folder.writeHostAsync("");

      const located = HostLocatorService.locate(folder.directory, HostLocatorServiceTests.OWN_ENTRY_PATH);

      Assert.areEqual(realpathSync(entryPath), located);
    });
  }

  @TestMethod
  public findsNoOtherHostWhenTheFolderUsesThisOneAsync(): Promise<void> {
    return ProjectFolder.useAsync(async folder => {
      const entryPath = await folder.writeHostAsync("");

      Assert.isUndefined(HostLocatorService.locate(folder.directory, entryPath));
    });
  }

  @TestMethod
  public findsNoHostWhenNoneIsInstalledAsync(): Promise<void> {
    return ProjectFolder.useAsync(async folder => {
      Assert.isUndefined(HostLocatorService.locate(folder.directory, HostLocatorServiceTests.OWN_ENTRY_PATH));
    });
  }

  @TestMethod
  public rethrowsAFailureOtherThanAMissingHostAsync(): Promise<void> {
    return ProjectFolder.useAsync(async folder => {
      await folder.writeHostAsync("");
      await folder.writeAsync(join("node_modules", "@noldova", "context", "package.json"),
        JSON.stringify({ name: "@noldova/context", type: "module", exports: { ".": "./api/index.js" } }));

      const exception = Assert.throws(() => HostLocatorService.locate(folder.directory, HostLocatorServiceTests.OWN_ENTRY_PATH), Error);

      Assert.isTrue("code" in exception && exception.code === "ERR_PACKAGE_PATH_NOT_EXPORTED");
    });
  }
}
