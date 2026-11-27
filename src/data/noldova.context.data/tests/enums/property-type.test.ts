/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PropertyType } from "@noldova/context.data";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class PropertyTypeTests {
  @TestMethod
  public usesMemberNamesAsValues(): void {
    Assert.areEqual("String", PropertyType.String);
    Assert.areEqual("Integer", PropertyType.Integer);
    Assert.areEqual(2, Object.values(PropertyType).length);
  }
}
