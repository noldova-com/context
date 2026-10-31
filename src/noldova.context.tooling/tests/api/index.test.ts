/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import * as api from "@noldova/context.tooling";

@TestClass
export class ToolingApiTests {
  @TestMethod
  public exportsTheCompleteCatalog(): void {
    Assert.areEqual("ArchiveReader,CommandFailedException,GitHubAPI,PackageInfo,ProcessResult,ReleaseArchive,ReleaseService", Object.keys(api).sort().join(","));
  }
}
