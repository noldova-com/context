/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";
import { SchemaMismatchException } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class SchemaMismatchExceptionTests {
  @TestMethod
  public isADataExceptionNamingTheTableAndColumn(): void {
    const exception = new SchemaMismatchException("The column differs.", "notes", "text");

    Assert.isInstanceOf(exception, DataException);
    Assert.areEqual("SchemaMismatchException", exception.name);
    Assert.areEqual("The column differs.", exception.message);
    Assert.areEqual("notes", exception.table);
    Assert.areEqual("text", exception.column);
  }

  @TestMethod
  public namesNoColumnForATableWideMismatch(): void {
    const exception = new SchemaMismatchException("The table is missing.", "notes", null);

    Assert.areEqual("notes", exception.table);
    Assert.isNull(exception.column);
  }
}
