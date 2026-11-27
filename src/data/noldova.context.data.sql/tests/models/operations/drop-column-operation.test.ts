/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Column, DropColumnOperation, ForeignKey, PrimaryKey, Table } from "@noldova/context.data.sql";
import { InvalidOperationException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TestDialect } from "../../fixtures/test-dialect.fixture.js";

@TestClass
export class DropColumnOperationTests {
  @TestMethod
  public rendersTheDropInTheDialect(): void {
    const operation = new DropColumnOperation("notes", "body");

    Assert.areEqual("notes", operation.table);
    Assert.areEqual("body", operation.column);
    Assert.areEqual("ALTER TABLE \"notes\" DROP COLUMN \"body\"", operation.render(new TestDialect()));
  }

  @TestMethod
  public removesTheColumnWithItsForeignKeysAndItsPlaceInTheKey(): void {
    const table = new Table("notes", [new Column("id", "TEXT", false), new Column("day", "TEXT", false), new Column("ownerId", "TEXT", true)],
      new PrimaryKey(["id", "day"]), [new ForeignKey("ownerId", "owners", "id"), new ForeignKey("day", "days", "id")]);

    const withoutDay = new DropColumnOperation("notes", "day").applyTo(table);
    const withoutOwner = new DropColumnOperation("notes", "ownerId").applyTo(table);

    Assert.areEqual("id,ownerId", withoutDay.columns.map(t => t.name).join(","));
    Assert.areEqual("id", withoutDay.primaryKey?.columns.join(","));
    Assert.areEqual("ownerId", withoutDay.foreignKeys.map(t => t.column).join(","));
    Assert.areEqual("id,day", withoutOwner.primaryKey?.columns.join(","));
    Assert.areEqual("day", withoutOwner.foreignKeys.map(t => t.column).join(","));
  }

  @TestMethod
  public leavesNoKeyWhenItDropsTheKeysOnlyColumn(): void {
    const table = new Table("notes", [new Column("id", "TEXT", false), new Column("text", "TEXT", true)], new PrimaryKey(["id"]), []);

    Assert.isNull(new DropColumnOperation("notes", "id").applyTo(table).primaryKey);
    Assert.isNull(new DropColumnOperation("notes", "text").applyTo(new Table("notes", table.columns, null, [])).primaryKey);
  }

  @TestMethod
  public rejectsAColumnTheTableDoesNotHave(): void {
    const table = new Table("notes", [new Column("id", "TEXT", false)], null, []);

    const exception = Assert.throws(() => new DropColumnOperation("notes", "body").applyTo(table), InvalidOperationException);

    Assert.areEqual("The table \"notes\" has no column \"body\".", exception.message);
  }
}
