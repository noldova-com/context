/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PropertyType } from "@noldova/context.data";
import { SnapshotProperty } from "@noldova/context.data/models/snapshots/snapshot-property.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class SnapshotPropertyTests {
  @TestMethod
  public keepsWhatItWasGiven(): void {
    const property = new SnapshotProperty("body", PropertyType.String, true, "post_body");

    Assert.areEqual("body", property.name);
    Assert.areEqual(PropertyType.String, property.type);
    Assert.isTrue(property.isOptional);
    Assert.areEqual("post_body", property.columnName);
  }
}
