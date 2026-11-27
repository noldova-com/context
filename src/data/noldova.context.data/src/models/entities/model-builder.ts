/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Dictionary, List } from "@noldova/context.collections";

import { ModelFactory } from "../../services/model-factory.js";
import type { EntityClass } from "../../types/entity-class.js";
import type { ModelSnapshot } from "../snapshots/model-snapshot.js";
import type { SnapshotEntity } from "../snapshots/snapshot-entity.js";
import { EntityTypeBuilder } from "./entity-type-builder.js";
import { EntityTypeDefinition } from "./entity-type-definition.js";
import type { Model } from "./model.js";

export class ModelBuilder {
  private readonly definitions: Dictionary<EntityClass<object>, EntityTypeDefinition> = new Dictionary();

  public entity<TEntity extends object>(type: EntityClass<TEntity>): EntityTypeBuilder<TEntity> {
    let definition = this.definitions.tryGet(type);
    if (Object.isUndefined(definition)) {
      definition = new EntityTypeDefinition(type);
      this.definitions.set(type, definition);
    }

    return new EntityTypeBuilder<TEntity>(definition);
  }

  public build(snapshot: ModelSnapshot | null): Model {
    return ModelFactory.create(this.definitions.values().toList().asReadOnly(), snapshot === null 
      ? new List<SnapshotEntity>().asReadOnly() 
      : snapshot.toEntities());
  }
}
