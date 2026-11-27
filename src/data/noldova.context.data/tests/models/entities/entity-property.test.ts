/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PropertyType } from "@noldova/context.data";
import { EntityProperty } from "@noldova/context.data/models/entities/entity-property.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class EntityPropertyTests {
  @TestMethod
  public keepsWhatItWasGiven(): void {
    const property = new EntityProperty("body", PropertyType.String, "text", false);

    Assert.areEqual("body", property.name);
    Assert.areEqual(PropertyType.String, property.type);
    Assert.areEqual("text", property.columnName);
    Assert.isFalse(property.isRequired);
  }
}
