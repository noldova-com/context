/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";

import type { RelationKind } from "../../enums/relation-kind.js";
import type { EntityClass } from "../../types/entity-class.js";
import type { EntityProperty } from "./entity-property.js";

export class EntityRelation {
  public readonly kind: RelationKind;
  public readonly navigation: string | null;
  public readonly principal: EntityClass<object>;
  public readonly inverseNavigation: string | null;
  public readonly foreignKey: IReadOnlyList<EntityProperty>;

  public constructor(
    kind: RelationKind,
    navigation: string | null,
    principal: EntityClass<object>,
    inverseNavigation: string | null,
    foreignKey: Iterable<EntityProperty>) {
    this.kind = kind;
    this.navigation = navigation;
    this.principal = principal;
    this.inverseNavigation = inverseNavigation;
    this.foreignKey = new List(foreignKey).asReadOnly();
  }
}
