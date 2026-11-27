/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DropPrimaryKeyOperation, SchemaOperation, TableChangeOperation } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TestDialect } from "../../fixtures/test-dialect.fixture.js";

@TestClass
export class TableChangeOperationTests {
  @TestMethod
  public isASchemaOperationThatNamesItsTable(): void {
    const operation = new DropPrimaryKeyOperation("notes");

    Assert.isInstanceOf(operation, TableChangeOperation);
    Assert.isInstanceOf(operation, SchemaOperation);
    Assert.areEqual("notes", operation.table);
    Assert.areEqual("ALTER TABLE \"notes\" DROP CONSTRAINT \"PK_notes\"", operation.render(new TestDialect()));
  }
}
