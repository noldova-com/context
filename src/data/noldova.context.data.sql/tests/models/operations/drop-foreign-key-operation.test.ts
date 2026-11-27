/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Column, DropForeignKeyOperation, ForeignKey, Table } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TestDialect } from "../../fixtures/test-dialect.fixture.js";

@TestClass
export class DropForeignKeyOperationTests {
  @TestMethod
  public rendersTheDropInTheDialectAndRemovesTheColumnsForeignKeys(): void {
    const operation = new DropForeignKeyOperation("notes", "ownerId");
    const table = new Table("notes", [new Column("ownerId", "TEXT", false), new Column("day", "TEXT", false)], null,
      [new ForeignKey("ownerId", "owners", "id"), new ForeignKey("day", "days", "id")]);

    Assert.areEqual("notes", operation.table);
    Assert.areEqual("ownerId", operation.column);
    Assert.areEqual("ALTER TABLE \"notes\" DROP CONSTRAINT \"FK_notes_ownerId\"", operation.render(new TestDialect()));
    Assert.areEqual("day", operation.applyTo(table).foreignKeys.map(t => t.column).join(","));
  }
}
