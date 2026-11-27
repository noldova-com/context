/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Column, DropPrimaryKeyOperation, ForeignKey, PrimaryKey, Table } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TestDialect } from "../../fixtures/test-dialect.fixture.js";

@TestClass
export class DropPrimaryKeyOperationTests {
  @TestMethod
  public rendersTheDropInTheDialectAndClearsTheKey(): void {
    const operation = new DropPrimaryKeyOperation("notes");
    const table = new Table("notes", [new Column("id", "TEXT", false)], new PrimaryKey(["id"]), [new ForeignKey("id", "owners", "id")]);

    Assert.areEqual("notes", operation.table);
    Assert.areEqual("ALTER TABLE \"notes\" DROP CONSTRAINT \"PK_notes\"", operation.render(new TestDialect()));
    Assert.isNull(operation.applyTo(table).primaryKey);
    Assert.areEqual(1, operation.applyTo(table).foreignKeys.length);
  }
}
