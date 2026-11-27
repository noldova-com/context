/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException, RelationTargetUnmappedException } from "@noldova/context.data";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RelationTargetUnmappedExceptionTests {
  @TestMethod
  public isADataExceptionNamingWhatFailed(): void {
    const exception = new RelationTargetUnmappedException("Note", "book", "Book");

    Assert.isInstanceOf(exception, DataException);
    Assert.areEqual("RelationTargetUnmappedException", exception.name);
    Assert.areEqual("Note", exception.entity);
    Assert.areEqual("book", exception.navigation);
    Assert.areEqual("Book", exception.target);
    Assert.areEqual("The relation \"Note.book\" leads to \"Book\", which the model does not map.", exception.message);
  }
}
