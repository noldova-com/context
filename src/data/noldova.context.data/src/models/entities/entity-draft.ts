/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyDictionary, type IReadOnlyList, List } from "@noldova/context.collections";

import type { SnapshotEntity } from "../snapshots/snapshot-entity.js";
import type { EntityProperty } from "./entity-property.js";
import type { EntityRelation } from "./entity-relation.js";
import type { EntityTypeDefinition } from "./entity-type-definition.js";

export class EntityDraft {
  public readonly definition: EntityTypeDefinition;
  public readonly snapshot: SnapshotEntity;
  public readonly properties: IReadOnlyDictionary<string, EntityProperty>;
  public readonly key: IReadOnlyList<EntityProperty>;
  public readonly relations: List<EntityRelation> = new List();

  public constructor(
    definition: EntityTypeDefinition, 
    snapshot: SnapshotEntity, 
    properties: IReadOnlyDictionary<string, EntityProperty>, 
    key: IReadOnlyList<EntityProperty>) {
    this.definition = definition;
    this.snapshot = snapshot;
    this.properties = properties;
    this.key = key;
  }

  public get name(): string {
    return this.snapshot.name;
  }
}
