/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataToolsException, EntityPropertyTypeException } from "@noldova/context.data.tools";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class EntityPropertyTypeExceptionTests {
  @TestMethod
  public namesTheEntityAndTheProperty(): void {
    const exception = new EntityPropertyTypeException("Note", "tags");

    Assert.isInstanceOf(exception, DataToolsException);
    Assert.areEqual("EntityPropertyTypeException", exception.name);
    Assert.areEqual("Note", exception.entity);
    Assert.areEqual("tags", exception.property);
    Assert.areEqual("The property \"Note.tags\" has a type the tool can't map: write string or number, a mapped entity class with \"| null\", or an array of one; "
      + "add \"| null\" to a string or number that may be absent.", exception.message);
  }
}
