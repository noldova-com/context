/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { TestWorkerMessageKind } from "@noldova/context.testing/enums/test-worker-message-kind.js";

@TestClass
export class TestWorkerMessageKindTests {
  @TestMethod
  public namesTheMessageKindsCanonically(): void {
    Assert.areEqual<string>("Imported", TestWorkerMessageKind.Imported);
    Assert.areEqual<string>("Ready", TestWorkerMessageKind.Ready);
    Assert.areEqual<string>("Started", TestWorkerMessageKind.Started);
    Assert.areEqual<string>("MethodCompleted", TestWorkerMessageKind.MethodCompleted);
    Assert.areEqual<string>("TimedOut", TestWorkerMessageKind.TimedOut);
    Assert.areEqual<string>("ClassCompleted", TestWorkerMessageKind.ClassCompleted);
  }
}
