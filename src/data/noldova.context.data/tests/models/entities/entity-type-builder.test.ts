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
export class EntityTypeBuilderTests {
  @TestMethod
  public rejectsABlankTableAndAKeyWithoutProperties(): void {
    const entity = new ModelBuilder().entity(Tag);

    Assert.areEqual("name", Assert.throws(() => entity.toTable(" "), ArgumentException).parameterName);
    Assert.areEqual("properties", Assert.throws(() => entity.hasKey(), ArgumentException).parameterName);
  }
}
