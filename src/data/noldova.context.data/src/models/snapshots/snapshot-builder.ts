/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";

import { SnapshotEntityBuilder } from "./snapshot-entity-builder.js";
import type { SnapshotEntity } from "./snapshot-entity.js";

export class SnapshotBuilder {
  private readonly entities: List<SnapshotEntityBuilder> = new List();

  public entity(name: string): SnapshotEntityBuilder {
    const entity = new SnapshotEntityBuilder(name);
    this.entities.add(entity);

    return entity;
  }

  public toEntities(): IReadOnlyList<SnapshotEntity> {
    return this.entities.select(t => t.toEntity()).toList().asReadOnly();
  }
}
