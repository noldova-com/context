/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SnapshotBuilder } from "@noldova/context.data/models/snapshots/snapshot-builder.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class SnapshotBuilderTests {
  @TestMethod
  public startsWithNoEntities(): void {
    Assert.areEqual(0, new SnapshotBuilder().toEntities().count());
  }

  @TestMethod
  public keepsEntitiesInTheOrderTheyAreNamed(): void {
    const builder = new SnapshotBuilder();
    builder.entity("Post");
    builder.entity("Author");

    const entities = builder.toEntities();

    Assert.areEqual("Post,Author", String.join(",", entities.select(t => t.name)));
  }
}
