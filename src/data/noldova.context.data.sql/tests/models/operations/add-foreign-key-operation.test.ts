/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { AddForeignKeyOperation, Column, ForeignKey, Table } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TestDialect } from "../../fixtures/test-dialect.fixture.js";

@TestClass
export class AddForeignKeyOperationTests {
  @TestMethod
  public rendersTheForeignKeyInTheDialectAndAddsItLast(): void {
    const foreignKey = new ForeignKey("ownerId", "owners", "id");
    const operation = new AddForeignKeyOperation("notes", foreignKey);
    const table = new Table("notes", [new Column("ownerId", "TEXT", false)], null, [new ForeignKey("ownerId", "people", "id")]);

    Assert.areEqual("notes", operation.table);
    Assert.areEqual(foreignKey, operation.foreignKey);
    Assert.areEqual("ALTER TABLE \"notes\" ADD CONSTRAINT \"FK_notes_ownerId\" FOREIGN KEY (\"ownerId\") REFERENCES \"owners\" (\"id\")",
      operation.render(new TestDialect()));
    Assert.areEqual("people,owners", operation.applyTo(table).foreignKeys.map(t => t.principalTable).join(","));
  }
}
