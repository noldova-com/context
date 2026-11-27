/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Column } from "@noldova/context.data.sql";
import { ArgumentException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ColumnTests {
  @TestMethod
  public holdsADeclaration(): void {
    const column = new Column("title", "TEXT", true);

    Assert.areEqual("title", column.name);
    Assert.areEqual("TEXT", column.type);
    Assert.isTrue(column.isNullable);
  }

  @TestMethod
  public rejectsABlankNameOrType(): void {
    Assert.areEqual("name", Assert.throws(() => new Column(" ", "INTEGER", false), ArgumentException).parameterName);
    Assert.areEqual("type", Assert.throws(() => new Column("count", "", false), ArgumentException).parameterName);
  }
}
