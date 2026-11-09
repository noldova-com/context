/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ColumnType } from "@noldova/context.data.sql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ColumnTypeTests {
  @TestMethod
  public usesMemberNamesAsValues(): void {
    Assert.areEqual("Text", ColumnType.Text);
    Assert.areEqual("Integer", ColumnType.Integer);
    Assert.areEqual(2, Object.values(ColumnType).length);
  }
}
