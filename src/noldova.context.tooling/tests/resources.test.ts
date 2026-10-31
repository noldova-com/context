/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { CommandFailedException, PackageInfo, ReleaseService } from "@noldova/context.tooling";

import { ReleaseHostFixture } from "./fixtures/release-host.fixture.js";

@TestClass
export class ResourcesTests {
  @TestMethod
  public async reportsTheCanonicalMessagesAsync(): Promise<void> {
    const service = new ReleaseService(new ReleaseHostFixture(), [new PackageInfo("noldova.context.json", "noldova.context.json", "@noldova/context.json", true)]);

    Assert.areEqual(
      "Usage: npm run release -- source <version> <commit> | check <folder> <version> <commit> | publish <folder> <version> <commit> | tag <version> <commit>",
      (await Assert.throwsAsync(async () => await service.runAsync(["help"]), CommandFailedException)).message);
    Assert.areEqual(
      "The version \"1.0.0\" is not of the form 0.0.<n>, which every CONTEXT package uses until the first public release.",
      (await Assert.throwsAsync(async () => await service.runAsync(["source", "1.0.0", ReleaseHostFixture.COMMIT]), CommandFailedException)).message);
    Assert.areEqual(
      "The commit \"main\" is not a full 40-character commit hash.",
      (await Assert.throwsAsync(async () => await service.runAsync(["source", "0.0.4", "main"]), CommandFailedException)).message);
  }
}
