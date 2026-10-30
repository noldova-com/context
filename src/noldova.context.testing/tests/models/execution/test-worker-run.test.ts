/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestingException, TestMethod } from "@noldova/context.testing";
import { TestWorkerRun } from "@noldova/context.testing/models/execution/test-worker-run.js";

@TestClass
export class TestWorkerRunTests {
  @TestMethod
  public crossesTheWorkerBoundaryUnchanged(): void {
    const received = TestWorkerRun.from(structuredClone(new TestWorkerRun(2, 3, true).toData()));

    Assert.areEqual(2, received.classIndex);
    Assert.areEqual(3, received.startMethodIndex);
    Assert.isTrue(received.isStartMethodStopped);
  }

  @TestMethod
  public rejectsDataThatIsNoWorkerRun(): void {
    Assert.throws(() => TestWorkerRun.from({ classIndex: 0 }), TestingException);
  }
}
