/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Model } from "@noldova/context.data/models/entities/model.js";
import { ModelBuilder } from "@noldova/context.data/models/entities/model-builder.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { Author } from "../../fixtures/author.fixture.js";
import { BlogSnapshot } from "../../fixtures/blog-snapshot.fixture.js";
import { Post } from "../../fixtures/post.fixture.js";
import { Profile } from "../../fixtures/profile.fixture.js";
import { Tag } from "../../fixtures/tag.fixture.js";

@TestClass
export class ModelTests {
  @TestMethod
  public findsAnEntityTypeByItsClass(): void {
    const entityTypes = [...ModelTests.blogEntityTypes()];

    const model = new Model(entityTypes);
    entityTypes.length = 0;

    Assert.areEqual(4, model.entityTypes.count());
    Assert.areEqual(Post, model.findEntityType(Post)?.type);
    Assert.isNull(model.findEntityType(class Unmapped {}));
  }

  @TestMethod
  public findsNothingInAnEmptyModel(): void {
    Assert.isNull(new Model([]).findEntityType(Author));
  }

  private static blogEntityTypes(): Model["entityTypes"] {
    const builder = new ModelBuilder();
    builder.entity(Author);
    builder.entity(Post);
    builder.entity(Profile);
    builder.entity(Tag);

    return builder.build(new BlogSnapshot()).entityTypes;
  }
}
