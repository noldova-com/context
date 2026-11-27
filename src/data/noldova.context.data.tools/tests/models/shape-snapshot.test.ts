/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PropertyType } from "@noldova/context.data";
import { EntityShape } from "@noldova/context.data.tools/models/shapes/entity-shape.js";
import { NavigationShape } from "@noldova/context.data.tools/models/shapes/navigation-shape.js";
import { PropertyShape } from "@noldova/context.data.tools/models/shapes/property-shape.js";
import { ShapeSnapshot } from "@noldova/context.data.tools/models/shapes/shape-snapshot.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ShapeSnapshotTests {
  @TestMethod
  public recordsEachShapeAsTheSnapshotsEntities(): void {
    const note = new EntityShape("Note", [new PropertyShape("id", PropertyType.Integer, false), new PropertyShape("body", PropertyType.String, true)],
      [new NavigationShape("owner", "Owner", false), new NavigationShape("tags", "Tag", true)]);
    const snapshot = new ShapeSnapshot([note]);

    const entity = snapshot.toEntities().single();

    Assert.areEqual(note, snapshot.entities[0]);
    Assert.areEqual("Note", entity.name);
    Assert.areEqual("id:false,body:true", entity.properties.select(t => `${t.name}:${t.isOptional}`).toArray().join(","));
    Assert.areEqual("owner:Owner:false,tags:Tag:true", entity.navigations.select(t => `${t.name}:${t.target}:${t.isCollection}`).toArray().join(","));
  }
}
