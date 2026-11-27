/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as api from "@noldova/context.sdk";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class SDKApiTests {
  @TestMethod
  public exportsTheCompleteRuntimeSurface(): void {
    Assert.areEqual("BuildCommand,SDKException", Object.keys(api).sort().join(","));
  }
}
