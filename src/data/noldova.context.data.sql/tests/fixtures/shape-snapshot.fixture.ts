/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ModelSnapshot, type SnapshotBuilder } from "@noldova/context.data";

export class ShapeSnapshot extends ModelSnapshot {
  private readonly shape: (builder: SnapshotBuilder) => void;

  public constructor(shape: (builder: SnapshotBuilder) => void) {
    super();
    this.shape = shape;
  }

  protected override buildModel(builder: SnapshotBuilder): void {
    this.shape(builder);
  }
}
