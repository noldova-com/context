/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, AssertFailedException, TestClass, TestingException, TestMethod, TestMethodResult, TestOutcome } from "@noldova/context.testing";
import { TestWorkerResult } from "@noldova/context.testing/models/execution/test-worker-result.js";

@TestClass
export class TestWorkerResultTests {
  @TestMethod
  public crossesAPassedTest(): void {
    const crossed = TestWorkerResultTests.cross(new TestMethodResult("Sample", "SampleTests", "passes", undefined, [], TestOutcome.Passed, 1.5, undefined,
      undefined));

    Assert.areEqual("Sample", crossed.packageName);
    Assert.areEqual("SampleTests.passes", crossed.displayName);
    Assert.isUndefined(crossed.testDataIndex);
    Assert.areEqual(0, crossed.testData.length);
    Assert.areEqual(TestOutcome.Passed, crossed.outcome);
    Assert.areEqual(1.5, crossed.durationMilliseconds);
    Assert.isUndefined(crossed.failure);
    Assert.isUndefined(crossed.skipReason);
  }

  @TestMethod
  public crossesAFailedDataRowWithItsDataAndFailure(): void {
    const crossed = TestWorkerResultTests.cross(new TestMethodResult("Sample", "SampleTests", "receives", 2, ["text", { toString: (): string => "row" }],
      TestOutcome.Failed, 3, new AssertFailedException("Sample failed.", 1, 2), undefined));

    Assert.areEqual("SampleTests.receives[2]", crossed.displayName);
    Assert.areEqual("text", crossed.testData[0]);
    Assert.areEqual("row", String(crossed.testData[1]));
    Assert.areEqual(TestOutcome.Failed, crossed.outcome);
    Assert.isInstanceOf(crossed.failure, AssertFailedException);
    Assert.areEqual(2, crossed.failure.actual);
  }

  @TestMethod
  public crossesASkippedTestWithItsReason(): void {
    const crossed = TestWorkerResultTests.cross(new TestMethodResult("Sample", "SampleTests", "waits", undefined, [], TestOutcome.Skipped, 0, undefined,
      "Not yet."));

    Assert.areEqual(TestOutcome.Skipped, crossed.outcome);
    Assert.areEqual("Not yet.", crossed.skipReason);
  }

  @TestMethod
  public rejectsAnUnknownOutcome(): void {
    const data = new TestWorkerResult(new TestMethodResult("Sample", "SampleTests", "passes", undefined, [], TestOutcome.Passed, 0, undefined,
      undefined)).toData();

    Assert.throws(() => TestWorkerResult.from({ ...data, outcome: "Paused" }), TestingException);
  }

  private static cross(methodResult: TestMethodResult): TestMethodResult {
    return TestWorkerResult.from(structuredClone(new TestWorkerResult(methodResult).toData())).methodResult;
  }
}
