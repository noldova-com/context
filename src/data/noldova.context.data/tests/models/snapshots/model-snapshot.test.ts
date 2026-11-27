/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PropertyType } from "@noldova/context.data";
import { ModelSnapshot } from "@noldova/context.data/models/snapshots/model-snapshot.js";
import type { SnapshotBuilder } from "@noldova/context.data/models/snapshots/snapshot-builder.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

class CountingSnapshot extends ModelSnapshot {
  public builds: number = 0;

  protected override buildModel(builder: SnapshotBuilder): void {
    this.builds++;
    builder.entity("Tag").property("id", PropertyType.Integer);
  }
}

@TestClass
export class ModelSnapshotTests {
  @TestMethod
  public buildsItsEntitiesEachTimeTheyAreAsked(): void {
    const snapshot = new CountingSnapshot();

    const first = snapshot.toEntities();
    const second = snapshot.toEntities();

    Assert.areEqual(2, snapshot.builds);
    Assert.areNotEqual(first, second);
    Assert.areEqual("Tag", first.get(0).name);
    Assert.areEqual("Tag", second.get(0).name);
  }
}
