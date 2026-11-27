/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EntityTypeDefinition } from "@noldova/context.data/models/entities/entity-type-definition.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { Author } from "../../fixtures/author.fixture.js";

@TestClass
export class EntityTypeDefinitionTests {
  @TestMethod
  public startsWithItsClassNameAndNothingConfigured(): void {
    const definition = new EntityTypeDefinition(Author);

    Assert.areEqual(Author, definition.type);
    Assert.areEqual("Author", definition.tableName);
    Assert.isNull(definition.key);
    Assert.areEqual(0, definition.columnNames.count());
    Assert.areEqual(0, definition.foreignKeys.count());
  }
}
