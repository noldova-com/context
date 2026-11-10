/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DataValue } from "@noldova/context.data";
import { SqlQuery } from "@noldova/context.data.sql";
import { ArgumentException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class SqlQueryTests {
  @TestMethod
  public holdsTextAndACopyOfItsParameters(): void {
    const parameters: DataValue[] = ["a", 1, null];
    const query = new SqlQuery("SELECT ? , ?, ?", parameters);
    parameters.length = 0;

    Assert.areEqual("SELECT ? , ?, ?", query.text);
    Assert.areEqual(3, query.parameters.length);
    Assert.areEqual("SELECT ? , ?, ?", query.toString());
  }

  @TestMethod
  public hasNoParametersByDefault(): void {
    Assert.areEqual(0, new SqlQuery("SELECT 1").parameters.length);
  }

  @TestMethod
  public rejectsBlankText(): void {
    Assert.areEqual("text", Assert.throws(() => new SqlQuery(" "), ArgumentException).parameterName);
  }
}
