/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import { type Model, ModelSnapshot, type SnapshotBuilder } from "@noldova/context.data";

import type { EntityShape } from "./entity-shape.js";

export class MappedSnapshot extends ModelSnapshot {
  private readonly model: Model;
  private readonly shapes: List<EntityShape>;

  public constructor(model: Model, shapes: readonly EntityShape[]) {
    super();

    this.model = model;
    this.shapes = new List(shapes);
  }

  protected override buildModel(builder: SnapshotBuilder): void {
    for (const entity of this.model.entityTypes) {
      const entityBuilder = builder.entity(entity.type.name).toTable(entity.tableName);
      for (const property of entity.properties)
        if (property.isRequired)
          entityBuilder.property(property.name, property.type, property.columnName);
        else
          entityBuilder.optionalProperty(property.name, property.type, property.columnName);
      entityBuilder.hasKey(...entity.key.select(t => t.name).toArray());
      for (const relation of entity.relations)
        entityBuilder.hasForeignKey(relation.principal.name, ...relation.foreignKey.select(t => t.name).toArray());
      for (const navigation of this.shapes.first(t => t.name === entity.type.name).navigations)
        if (navigation.isCollection)
          entityBuilder.collection(navigation.name, navigation.target);
        else
          entityBuilder.reference(navigation.name, navigation.target);
    }
  }
}
