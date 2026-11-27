/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { AmbiguousRelationException, DataException } from "@noldova/context.data";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class AmbiguousRelationExceptionTests {
  @TestMethod
  public isADataExceptionNamingWhatFailed(): void {
    const exception = new AmbiguousRelationException("Note", "author");

    Assert.isInstanceOf(exception, DataException);
    Assert.areEqual("AmbiguousRelationException", exception.name);
    Assert.areEqual("Note", exception.entity);
    Assert.areEqual("author", exception.navigation);
    Assert.areEqual("The relation \"Note.author\" has more than one inverse navigation on its principal.", exception.message);
  }
}
