/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { AlterColumnOperation, Column, ForeignKey, PrimaryKey, Table } from "@noldova/context.data.sql";
import { InvalidOperationException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TestDialect } from "../../fixtures/test-dialect.fixture.js";

@TestClass
export class AlterColumnOperationTests {
  @TestMethod
  public rendersTheChangeInTheDialect(): void {
    const column = new Column("title", "INTEGER", true);
    const operation = new AlterColumnOperation("notes", column);

    Assert.areEqual("notes", operation.table);
    Assert.areEqual(column, operation.column);
    Assert.areEqual("ALTER notes.title INTEGER NULL", operation.render(new TestDialect()));
  }

  @TestMethod
  public changesTheColumnKeepingItsDefaultAndTheRestOfTheTable(): void {
    const key = new PrimaryKey(["id"]);
    const foreignKeys = [new ForeignKey("ownerId", "owners", "id")];
    const table = new Table("notes", [new Column("id", "TEXT", false), new Column("title", "TEXT", false, "''")], key, foreignKeys);

    const changed = new AlterColumnOperation("notes", new Column("title", "INTEGER", true)).applyTo(table);

    Assert.areEqual("id:TEXT:false:null,title:INTEGER:true:''", changed.columns.map(t => `${t.name}:${t.type}:${t.isNullable}:${t.defaultValueSql}`).join(","));
    Assert.areEqual(key, changed.primaryKey);
    Assert.areEqual("ownerId", changed.foreignKeys.map(t => t.column).join(","));
  }

  @TestMethod
  public givesTheColumnTheDefaultTheChangeHas(): void {
    const table = new Table("notes", [new Column("id", "TEXT", false), new Column("title", "TEXT", true, "''")], null, []);

    const changed = new AlterColumnOperation("notes", new Column("title", "TEXT", false, "'none'")).applyTo(table);

    Assert.areEqual("title:false:'none'", changed.columns.filter(t => t.name === "title").map(t => `${t.name}:${t.isNullable}:${t.defaultValueSql}`).join(","));
  }

  @TestMethod
  public rejectsAColumnTheTableDoesNotHave(): void {
    const table = new Table("notes", [new Column("id", "TEXT", false)], null, []);

    const exception = Assert.throws(() => new AlterColumnOperation("notes", new Column("body", "TEXT", true)).applyTo(table), InvalidOperationException);

    Assert.areEqual("The table \"notes\" has no column \"body\".", exception.message);
  }
}
