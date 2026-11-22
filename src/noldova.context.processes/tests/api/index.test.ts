/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as api from "@noldova/context.processes";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ProcessesApiTests {
  @TestMethod
  public exportsTheCompleteCatalog(): void {
    Assert.areEqual("ProcessIdentity,ProcessTree,ProcessTreeEndException,ProcessTreeEndOptions,ProcessesException", Object.keys(api).sort().join(","));
  }
}
