/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException, EntityPropertyMissingException } from "@noldova/context.data";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class EntityPropertyMissingExceptionTests {
  @TestMethod
  public isADataExceptionNamingWhatFailed(): void {
    const exception = new EntityPropertyMissingException("Note", "bookId");

    Assert.isInstanceOf(exception, DataException);
    Assert.areEqual("EntityPropertyMissingException", exception.name);
    Assert.areEqual("Note", exception.entity);
    Assert.areEqual("bookId", exception.property);
    Assert.areEqual("The entity \"Note\" has no property \"bookId\".", exception.message);
  }
}
