/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ModelBuilder } from "@noldova/context.data/models/entities/model-builder.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { Author } from "../../fixtures/author.fixture.js";
import { BlogSnapshot } from "../../fixtures/blog-snapshot.fixture.js";
import { Post } from "../../fixtures/post.fixture.js";
import { Profile } from "../../fixtures/profile.fixture.js";
import { Tag } from "../../fixtures/tag.fixture.js";

@TestClass
export class EntityTypeTests {
  @TestMethod
  public findsAPropertyByName(): void {
    const builder = new ModelBuilder();
    builder.entity(Author);
    builder.entity(Post);
    builder.entity(Profile);
    builder.entity(Tag);
    const model = builder.build(new BlogSnapshot());

    const post = model.findEntityType(Post);
    Assert.isNotNull(post);

    Assert.areEqual("body", post.findProperty("body")?.name);
    Assert.isNull(post.findProperty("author"));
    Assert.isNull(model.findEntityType(class Unmapped {}));
  }
}
