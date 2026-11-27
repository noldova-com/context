/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";

import type { EntityClass } from "../../types/entity-class.js";
import type { EntityProperty } from "./entity-property.js";
import type { EntityRelation } from "./entity-relation.js";

export class EntityType {
  public readonly type: EntityClass<object>;
  public readonly tableName: string;
  public readonly properties: IReadOnlyList<EntityProperty>;
  public readonly key: IReadOnlyList<EntityProperty>;
  public readonly relations: IReadOnlyList<EntityRelation>;

  public constructor(type: EntityClass<object>, tableName: string, properties: Iterable<EntityProperty>, key: Iterable<EntityProperty>,
    relations: Iterable<EntityRelation>) {
    this.type = type;
    this.tableName = tableName;
    this.properties = new List(properties).asReadOnly();
    this.key = new List(key).asReadOnly();
    this.relations = new List(relations).asReadOnly();
  }

  public findProperty(name: string): EntityProperty | null {
    return this.properties.firstOrDefault(t => t.name === name) ?? null;
  }
}
