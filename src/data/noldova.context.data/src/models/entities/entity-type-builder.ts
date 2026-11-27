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
import { PropertyBuilder } from "./property-builder.js";
import { RelationBuilder } from "./relation-builder.js";

export class EntityTypeBuilder<TEntity> {
  private readonly definition: EntityTypeDefinition;

  public constructor(definition: EntityTypeDefinition) {
    this.definition = definition;
  }

  public toTable(name: string): this {
    ArgumentException.throwIfNullOrWhitespace(name, Resources.nameParameterName);
    this.definition.tableName = name;

    return this;
  }

  public hasKey(...properties: readonly PropertySelector<TEntity>[]): this {
    if (properties.length === 0)
      throw new ArgumentException(Resources.keyWithoutProperties, Resources.propertiesParameterName);

    this.definition.key = new List(properties.map(t => nameof<TEntity>(t))).asReadOnly();

    return this;
  }

  public property(property: PropertySelector<TEntity>): PropertyBuilder {
    return new PropertyBuilder(this.definition, nameof<TEntity>(property));
  }

  public hasOne(navigation: PropertySelector<TEntity>): RelationBuilder<TEntity> {
    return new RelationBuilder<TEntity>(this.definition, nameof<TEntity>(navigation));
  }
}
