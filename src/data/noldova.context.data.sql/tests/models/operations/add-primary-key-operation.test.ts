/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { AddPrimaryKeyOperation, Column, PrimaryKey, Table } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TestDialect } from "../../fixtures/test-dialect.fixture.js";

@TestClass
export class AddPrimaryKeyOperationTests {
  @TestMethod
  public rendersTheKeyInTheDialectAndSetsIt(): void {
    const key = new PrimaryKey(["id"]);
    const operation = new AddPrimaryKeyOperation("notes", key);
    const table = new Table("notes", [new Column("id", "TEXT", false)], null, []);

    Assert.areEqual("notes", operation.table);
    Assert.areEqual(key, operation.primaryKey);
    Assert.areEqual("ALTER TABLE \"notes\" ADD CONSTRAINT \"PK_notes\" PRIMARY KEY (\"id\")", operation.render(new TestDialect()));
    Assert.areEqual(key, operation.applyTo(table).primaryKey);
    Assert.areEqual(table.columns.length, operation.applyTo(table).columns.length);
  }
}
