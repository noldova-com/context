/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ModelSnapshot, type SnapshotBuilder } from "@noldova/context.data";

import type { EntityShape } from "./entity-shape.js";

export class ShapeSnapshot extends ModelSnapshot {
  public readonly entities: readonly EntityShape[];

  public constructor(entities: readonly EntityShape[]) {
    super();

    this.entities = entities;
  }

  protected override buildModel(builder: SnapshotBuilder): void {
    for (const entity of this.entities) {
      const entityBuilder = builder.entity(entity.name);
      for (const property of entity.properties)
        if (property.isOptional)
          entityBuilder.optionalProperty(property.name, property.type);
        else
          entityBuilder.property(property.name, property.type);
      for (const navigation of entity.navigations)
        if (navigation.isCollection)
          entityBuilder.collection(navigation.name, navigation.target);
        else
          entityBuilder.reference(navigation.name, navigation.target);
    }
  }
}
