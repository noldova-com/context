/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SnapshotForeignKey } from "@noldova/context.data/models/snapshots/snapshot-foreign-key.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class SnapshotForeignKeyTests {
  @TestMethod
  public copiesWhatItWasGiven(): void {
    const properties = ["authorId", "authorRegion"];

    const foreignKey = new SnapshotForeignKey("Author", properties);
    properties.length = 0;

    Assert.areEqual("Author", foreignKey.principal);
    Assert.areEqual("authorId,authorRegion", String.join(",", foreignKey.properties));
  }
}
