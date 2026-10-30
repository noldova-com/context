/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestingException, TestMethod, TestProject } from "@noldova/context.testing";
import { TestWorkerStart } from "@noldova/context.testing/models/execution/test-worker-start.js";

@TestClass
export class TestWorkerStartTests {
  @TestMethod
  public crossesTheWorkerBoundaryUnchanged(): void {
    const start = new TestWorkerStart([new TestProject("Sample", "/tests")], ["category:Unit"], 250);

    const received = TestWorkerStart.from(structuredClone(start.toData()));

    Assert.areEqual("Sample", received.testProjects[0]!.packageName);
    Assert.areEqual("/tests", received.testProjects[0]!.rootDirectory);
    Assert.areEqual("category:Unit", received.filters.join());
    Assert.areEqual(250, received.timeoutMilliseconds);
  }

  @TestMethod
  public rejectsDataThatIsNoWorkerStart(): void {
    Assert.throws(() => TestWorkerStart.from({ testProjects: [] }), TestingException);
  }
}
