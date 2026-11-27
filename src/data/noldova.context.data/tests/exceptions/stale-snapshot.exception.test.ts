/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException, StaleSnapshotException } from "@noldova/context.data";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class StaleSnapshotExceptionTests {
  @TestMethod
  public isADataExceptionNamingWhatFailed(): void {
    const exception = new StaleSnapshotException("Note");

    Assert.isInstanceOf(exception, DataException);
    Assert.areEqual("StaleSnapshotException", exception.name);
    Assert.areEqual("Note", exception.entity);
    Assert.areEqual("The entity \"Note\" changed since the model snapshot was made: add a migration.", exception.message);
  }
}
