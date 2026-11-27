/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException, EntityKeyMissingException } from "@noldova/context.data";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class EntityKeyMissingExceptionTests {
  @TestMethod
  public isADataExceptionNamingWhatFailed(): void {
    const exception = new EntityKeyMissingException("Note");

    Assert.isInstanceOf(exception, DataException);
    Assert.areEqual("EntityKeyMissingException", exception.name);
    Assert.areEqual("Note", exception.entity);
    Assert.areEqual("The entity \"Note\" has no key: name one with hasKey, or declare a property named \"id\" or \"NoteId\", in any letter case.", exception.message);
  }
}
