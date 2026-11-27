/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException, ReferenceMissingException } from "@noldova/context.data";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ReferenceMissingExceptionTests {
  @TestMethod
  public isADataExceptionNamingWhatFailed(): void {
    const exception = new ReferenceMissingException("Author", "posts");

    Assert.isInstanceOf(exception, DataException);
    Assert.areEqual("ReferenceMissingException", exception.name);
    Assert.areEqual("Author", exception.entity);
    Assert.areEqual("posts", exception.navigation);
    Assert.areEqual("The entity \"Author\" has no reference \"posts\" to configure a foreign key on.", exception.message);
  }
}
