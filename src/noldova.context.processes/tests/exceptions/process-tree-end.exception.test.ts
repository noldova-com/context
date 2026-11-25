/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import { ProcessesException, ProcessIdentity, ProcessTreeEndException } from "@noldova/context.processes";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ProcessTreeEndExceptionTests {
  @TestMethod
  public namesEachSurvivorAndTheLimit(): void {
    const survivors = new List([new ProcessIdentity(12, 0), new ProcessIdentity(34, 1_763_806_000_123)]);

    const exception = new ProcessTreeEndException(survivors, 250);

    Assert.isInstanceOf(exception, ProcessesException);
    Assert.areEqual(survivors, exception.survivors);
    Assert.areEqual("The process tree still had 2 processes when its 250 ms limit passed: " +
      "12 started at 1970-01-01T00:00:00.000Z, 34 started at 2025-11-22T10:06:40.123Z.", exception.message);
  }
}
