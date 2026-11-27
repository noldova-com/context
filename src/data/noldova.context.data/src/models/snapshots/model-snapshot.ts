/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";

import { SnapshotBuilder } from "./snapshot-builder.js";
import type { SnapshotEntity } from "./snapshot-entity.js";

export abstract class ModelSnapshot {
  public toEntities(): IReadOnlyList<SnapshotEntity> {
    const builder = new SnapshotBuilder();
    this.buildModel(builder);

    return builder.toEntities();
  }

  protected abstract buildModel(builder: SnapshotBuilder): void;
}
