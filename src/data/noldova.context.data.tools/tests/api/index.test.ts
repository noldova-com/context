/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as api from "@noldova/context.data.tools";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class DataToolsApiTests {
  @TestMethod
  public exportsTheCompleteRuntimeSurface(): void {
    Assert.areEqual("DataToolsException,EntityPropertyTypeException,MigrationsCommand", Object.keys(api).sort().join(","));
  }
}
