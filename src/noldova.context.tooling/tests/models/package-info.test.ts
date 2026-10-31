/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { PackageInfo } from "@noldova/context.tooling";

@TestClass
export class PackageInfoTests {
  @TestMethod
  public keepsItsValues(): void {
    const packageInfo = new PackageInfo("noldova.context.parsers", "parsers/noldova.context.parsers", "@noldova/context.parsers", false);

    Assert.areEqual("noldova.context.parsers", packageInfo.name);
    Assert.areEqual("parsers/noldova.context.parsers", packageInfo.path);
    Assert.areEqual("@noldova/context.parsers", packageInfo.packageName);
    Assert.isFalse(packageInfo.isPublished);
  }

  @TestMethod
  public namesTheArchiveAsNpmPackDoes(): void {
    Assert.areEqual("noldova-context.json-0.0.3.tgz", new PackageInfo("noldova.context.json", "noldova.context.json", "@noldova/context.json", true).archiveName("0.0.3"));
  }
}
