/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException, ColumnMappedTwiceException } from "@noldova/context.data";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ColumnMappedTwiceExceptionTests {
  @TestMethod
  public isADataExceptionNamingWhatFailed(): void {
    const exception = new ColumnMappedTwiceException("notes", "title");

    Assert.isInstanceOf(exception, DataException);
    Assert.areEqual("ColumnMappedTwiceException", exception.name);
    Assert.areEqual("notes", exception.table);
    Assert.areEqual("title", exception.column);
    Assert.areEqual("The table \"notes\" maps two properties to the column \"title\".", exception.message);
  }
}
