/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ModelBuilder } from "@noldova/context.data/models/entities/model-builder.js";
import { ArgumentException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { Tag } from "../../fixtures/tag.fixture.js";

@TestClass
export class PropertyBuilderTests {
  @TestMethod
  public rejectsABlankColumn(): void {
    const property = new ModelBuilder().entity(Tag).property(t => t.label);

    Assert.areEqual("name", Assert.throws(() => property.hasColumnName(""), ArgumentException).parameterName);
  }
}
