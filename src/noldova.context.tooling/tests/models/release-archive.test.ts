/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { PackageInfo, ReleaseArchive } from "@noldova/context.tooling";

@TestClass
export class ReleaseArchiveTests {
  @TestMethod
  public pairsAPackageWithItsArchive(): void {
    const packageInfo = new PackageInfo("noldova.context.json", "noldova.context.json", "@noldova/context.json", true);
    const archive = new ReleaseArchive(packageInfo, "/packages/noldova-context.json-0.0.3.tgz");

    Assert.areEqual(packageInfo, archive.packageInfo);
    Assert.areEqual("/packages/noldova-context.json-0.0.3.tgz", archive.filePath);
  }
}
