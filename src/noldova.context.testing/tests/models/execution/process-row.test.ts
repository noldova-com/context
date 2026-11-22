/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";
import { ProcessRow } from "@noldova/context.testing/models/execution/process-row.js";

@TestClass
export class ProcessRowTests {
  @TestMethod
  public readsAnIdAndAParent(): void {
    const row = ProcessRow.parse(" 21  5 ");

    Assert.isDefined(row);
    Assert.areEqual(21, row.processId);
    Assert.areEqual(5, row.parentId);
    Assert.isUndefined(row.created);
  }

  @TestMethod
  public readsAStartTimeAfterTheParent(): void {
    const row = ProcessRow.parse("21 5 20261122115338.123456-480");

    Assert.isDefined(row);
    Assert.areEqual("20261122115338.123456-480", row.created);
  }

  @TestData("21")
  @TestData("21 5 20261122115338.123456-480 extra")
  @TestMethod
  public readsNothingFromALineWithAnotherNumberOfFields(line: string): void {
    Assert.isUndefined(ProcessRow.parse(line));
  }
}
