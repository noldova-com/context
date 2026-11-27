/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PropertyType, RelationKind } from "@noldova/context.data";
import { EntityProperty } from "@noldova/context.data/models/entities/entity-property.js";
import { EntityRelation } from "@noldova/context.data/models/entities/entity-relation.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { Author } from "../../fixtures/author.fixture.js";

@TestClass
export class EntityRelationTests {
  @TestMethod
  public keepsWhatItWasGiven(): void {
    const authorId = new EntityProperty("authorId", PropertyType.Integer, "authorId", true);

    const relation = new EntityRelation(RelationKind.OneToMany, "author", Author, "posts", [authorId]);

    Assert.areEqual(RelationKind.OneToMany, relation.kind);
    Assert.areEqual("author", relation.navigation);
    Assert.areEqual(Author, relation.principal);
    Assert.areEqual("posts", relation.inverseNavigation);
    Assert.areEqual(1, relation.foreignKey.count());
    Assert.areEqual(authorId, relation.foreignKey.get(0));
  }

  @TestMethod
  public copiesItsForeignKey(): void {
    const foreignKey = [new EntityProperty("authorId", PropertyType.Integer, "authorId", true)];

    const relation = new EntityRelation(RelationKind.OneToOne, null, Author, null, foreignKey);
    foreignKey.length = 0;

    Assert.areEqual(1, relation.foreignKey.count());
    Assert.isNull(relation.navigation);
    Assert.isNull(relation.inverseNavigation);
  }
}
