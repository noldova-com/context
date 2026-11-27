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

import { Post } from "../../fixtures/post.fixture.js";

@TestClass
export class RelationBuilderTests {
  @TestMethod
  public rejectsAForeignKeyWithoutProperties(): void {
    const relation = new ModelBuilder().entity(Post).hasOne(t => t.author);

    const exception = Assert.throws(() => relation.hasForeignKey(), ArgumentException);

    Assert.areEqual("properties", exception.parameterName);
    Assert.areEqual("A foreign key names at least one property. (Parameter 'properties')", exception.message);
  }
}
