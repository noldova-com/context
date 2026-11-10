/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PrimaryKey } from "@noldova/context.data.sql";
import { ArgumentException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class PrimaryKeyTests {
  @TestMethod
  public holdsACopyOfItsColumns(): void {
    const columns = ["conversationId", "sequence"];
    const key = new PrimaryKey(columns);
    columns.length = 0;

    Assert.areEqual("conversationId,sequence", key.columns.join(","));
  }

  @TestMethod
  public rejectsAKeyWithoutColumns(): void {
    Assert.areEqual("columns", Assert.throws(() => new PrimaryKey([]), ArgumentException).parameterName);
  }
}
