/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as api from "@noldova/context.json";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class JsonApiTests {
  @TestMethod
  public exportsTheCompleteCatalog(): void {
    Assert.areEqual("JsonException,JsonReader", Object.keys(api).sort().join(","));
  }
}
