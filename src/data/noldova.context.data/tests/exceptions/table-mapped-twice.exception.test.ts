/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException, TableMappedTwiceException } from "@noldova/context.data";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TableMappedTwiceExceptionTests {
  @TestMethod
  public isADataExceptionNamingWhatFailed(): void {
    const exception = new TableMappedTwiceException("notes");

    Assert.isInstanceOf(exception, DataException);
    Assert.areEqual("TableMappedTwiceException", exception.name);
    Assert.areEqual("notes", exception.table);
    Assert.areEqual("Two entities are mapped to the table \"notes\".", exception.message);
  }
}
