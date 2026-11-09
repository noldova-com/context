/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataSource } from "@noldova/context.data";
import { ArgumentException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class DataSourceTests {
  @TestMethod
  public holdsANameAndALocation(): void {
    const dataSource = new DataSource("app", "/data/app.db");

    Assert.areEqual("app", dataSource.name);
    Assert.areEqual("/data/app.db", dataSource.location);
  }

  @TestMethod
  public rejectsBlankParts(): void {
    Assert.areEqual("name", Assert.throws(() => new DataSource(" ", "/data"), ArgumentException).parameterName);
    Assert.areEqual("location", Assert.throws(() => new DataSource("app", ""), ArgumentException).parameterName);
  }
}
