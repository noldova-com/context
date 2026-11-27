/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { AddColumnOperation, Column } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TestDialect } from "../../fixtures/test-dialect.fixture.js";

@TestClass
export class AddColumnOperationTests {
  @TestMethod
  public rendersTheAdditionInTheDialect(): void {
    const column = new Column("body", "TEXT", true);
    const operation = new AddColumnOperation("notes", column);

    Assert.areEqual("notes", operation.table);
    Assert.areEqual(column, operation.column);
    Assert.areEqual("ALTER TABLE \"notes\" ADD COLUMN \"body\" TEXT", operation.render(new TestDialect()));
  }
}
