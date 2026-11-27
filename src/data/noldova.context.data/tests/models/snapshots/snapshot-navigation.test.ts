/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SnapshotNavigation } from "@noldova/context.data/models/snapshots/snapshot-navigation.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class SnapshotNavigationTests {
  @TestMethod
  public keepsWhatItWasGiven(): void {
    const navigation = new SnapshotNavigation("tags", "Tag", true);

    Assert.areEqual("tags", navigation.name);
    Assert.areEqual("Tag", navigation.target);
    Assert.isTrue(navigation.isCollection);
  }
}
