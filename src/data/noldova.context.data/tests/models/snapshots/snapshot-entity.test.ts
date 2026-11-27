/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PropertyType } from "@noldova/context.data";
import { SnapshotEntity } from "@noldova/context.data/models/snapshots/snapshot-entity.js";
import { SnapshotNavigation } from "@noldova/context.data/models/snapshots/snapshot-navigation.js";
import { SnapshotProperty } from "@noldova/context.data/models/snapshots/snapshot-property.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class SnapshotEntityTests {
  @TestMethod
  public copiesWhatItWasGiven(): void {
    const id = new SnapshotProperty("id", PropertyType.Integer, false);
    const author = new SnapshotNavigation("author", "Author", false);
    const properties = [id];
    const navigations = [author];

    const entity = new SnapshotEntity("Post", properties, navigations);
    properties.length = 0;
    navigations.length = 0;

    Assert.areEqual("Post", entity.name);
    Assert.areEqual(id, entity.properties.get(0));
    Assert.areEqual(author, entity.navigations.get(0));
  }
}
