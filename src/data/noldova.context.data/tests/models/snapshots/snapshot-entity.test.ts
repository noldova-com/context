/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PropertyType } from "@noldova/context.data";
import { SnapshotEntity } from "@noldova/context.data/models/snapshots/snapshot-entity.js";
import { SnapshotForeignKey } from "@noldova/context.data/models/snapshots/snapshot-foreign-key.js";
import { SnapshotNavigation } from "@noldova/context.data/models/snapshots/snapshot-navigation.js";
import { SnapshotProperty } from "@noldova/context.data/models/snapshots/snapshot-property.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class SnapshotEntityTests {
  @TestMethod
  public copiesWhatItWasGiven(): void {
    const id = new SnapshotProperty("id", PropertyType.Integer, false, "id");
    const toAuthor = new SnapshotForeignKey("Author", ["authorId"]);
    const author = new SnapshotNavigation("author", "Author", false);
    const properties = [id];
    const key = ["id"];
    const foreignKeys = [toAuthor];
    const navigations = [author];

    const entity = new SnapshotEntity("Post", "posts", properties, key, foreignKeys, navigations);
    properties.length = 0;
    key.length = 0;
    foreignKeys.length = 0;
    navigations.length = 0;

    Assert.areEqual("Post", entity.name);
    Assert.areEqual("posts", entity.tableName);
    Assert.areEqual(id, entity.properties.get(0));
    Assert.areEqual("id", entity.key.get(0));
    Assert.areEqual(toAuthor, entity.foreignKeys.get(0));
    Assert.areEqual(author, entity.navigations.get(0));
  }
}
