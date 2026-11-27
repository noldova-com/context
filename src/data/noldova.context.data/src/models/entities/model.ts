/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";

import type { EntityClass } from "../../types/entity-class.js";
import type { EntityType } from "./entity-type.js";

export class Model {
  public readonly entityTypes: IReadOnlyList<EntityType>;

  public constructor(entityTypes: Iterable<EntityType>) {
    this.entityTypes = new List(entityTypes).asReadOnly();
  }

  public findEntityType(type: EntityClass<object>): EntityType | null {
    return this.entityTypes.firstOrDefault(t => t.type === type) ?? null;
  }
}
