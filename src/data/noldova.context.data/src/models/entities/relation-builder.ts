/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import { nameof } from "@noldova/context.core";
import { ArgumentException } from "@noldova/context.exceptions";

import { Resources } from "../../resources.js";
import type { PropertySelector } from "../../types/property-selector.js";
import type { EntityTypeDefinition } from "./entity-type-definition.js";

export class RelationBuilder<TEntity> {
  private readonly definition: EntityTypeDefinition;
  private readonly navigation: string;

  public constructor(definition: EntityTypeDefinition, navigation: string) {
    this.definition = definition;
    this.navigation = navigation;
  }

  public hasForeignKey(...properties: readonly PropertySelector<TEntity>[]): this {
    if (properties.length === 0)
      throw new ArgumentException(Resources.foreignKeyWithoutProperties, Resources.propertiesParameterName);

    this.definition.foreignKeys.set(this.navigation, new List(properties.map(t => nameof<TEntity>(t))).asReadOnly());

    return this;
  }
}
