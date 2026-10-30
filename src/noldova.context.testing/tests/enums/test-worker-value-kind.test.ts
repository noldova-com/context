/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { TestWorkerValueKind } from "@noldova/context.testing/enums/test-worker-value-kind.js";

@TestClass
export class TestWorkerValueKindTests {
  @TestMethod
  public namesTheValueKindsCanonically(): void {
    Assert.areEqual<string>("Value", TestWorkerValueKind.Value);
    Assert.areEqual<string>("Text", TestWorkerValueKind.Text);
    Assert.areEqual<string>("Error", TestWorkerValueKind.Error);
    Assert.areEqual<string>("Assert", TestWorkerValueKind.Assert);
    Assert.areEqual<string>("Timeout", TestWorkerValueKind.Timeout);
  }
}
