/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException, ForeignKeyMismatchException } from "@noldova/context.data";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ForeignKeyMismatchExceptionTests {
  @TestMethod
  public isADataExceptionNamingWhatFailed(): void {
    const exception = new ForeignKeyMismatchException("Note", "book");

    Assert.isInstanceOf(exception, DataException);
    Assert.areEqual("ForeignKeyMismatchException", exception.name);
    Assert.areEqual("Note", exception.entity);
    Assert.areEqual("book", exception.navigation);
    Assert.areEqual("The foreign key of \"Note.book\" does not match its principal's key in count or type.", exception.message);
  }
}
