/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DropTableOperation } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TestDialect } from "../../fixtures/test-dialect.fixture.js";

@TestClass
export class DropTableOperationTests {
  @TestMethod
  public rendersTheDropInTheDialect(): void {
    const operation = new DropTableOperation("notes");

    Assert.areEqual("notes", operation.table);
    Assert.areEqual("DROP TABLE \"notes\"", operation.render(new TestDialect()));
  }
}
