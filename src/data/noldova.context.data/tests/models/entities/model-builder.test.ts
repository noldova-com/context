/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { StaleSnapshotException } from "@noldova/context.data";
import { ModelBuilder } from "@noldova/context.data/models/entities/model-builder.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { Author } from "../../fixtures/author.fixture.js";
import { BlogSnapshot } from "../../fixtures/blog-snapshot.fixture.js";
import { Post } from "../../fixtures/post.fixture.js";
import { Profile } from "../../fixtures/profile.fixture.js";
import { Tag } from "../../fixtures/tag.fixture.js";

@TestClass
export class ModelBuilderTests {
  @TestMethod
  public buildsAnEmptyModelWithoutEntitiesOrASnapshot(): void {
    const model = new ModelBuilder().build(null);

    Assert.areEqual(0, model.entityTypes.count());
  }

  @TestMethod
  public readsNoEntitiesWithoutASnapshot(): void {
    const builder = new ModelBuilder();
    builder.entity(Tag);

    const exception = Assert.throws(() => builder.build(null), StaleSnapshotException);

    Assert.areEqual("Tag", exception.entity);
  }

  @TestMethod
  public configuresOneDefinitionPerClass(): void {
    const builder = new ModelBuilder();
    builder.entity(Author).toTable("authors");
    builder.entity(Author);
    builder.entity(Post);
    builder.entity(Profile);
    builder.entity(Tag);

    const model = builder.build(new BlogSnapshot());

    Assert.areEqual("Author,Post,Profile,Tag", builder.entityClasses.select(t => t.name).toArray().join(","));
    Assert.areEqual(4, model.entityTypes.count());
    Assert.areEqual("authors", model.findEntityType(Author)?.tableName);
  }
}
