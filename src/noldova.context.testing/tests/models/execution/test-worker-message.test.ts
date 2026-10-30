/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestingException, TestMethod, TestMethodResult, TestOutcome } from "@noldova/context.testing";
import { TestWorkerMessageKind } from "@noldova/context.testing/enums/test-worker-message-kind.js";
import { TestWorkerMessage } from "@noldova/context.testing/models/execution/test-worker-message.js";
import { TestWorkerResult } from "@noldova/context.testing/models/execution/test-worker-result.js";

@TestClass
export class TestWorkerMessageTests {
  @TestMethod
  public carriesAnImportedTestFile(): void {
    const message = TestWorkerMessage.from(structuredClone(TestWorkerMessage.imported("nested/sample.test.js").toData()));

    Assert.areEqual(TestWorkerMessageKind.Imported, message.kind);
    Assert.areEqual("nested/sample.test.js", message.filePath);
  }

  @TestMethod
  public carriesAReadyWorker(): void {
    const message = TestWorkerMessage.from(structuredClone(TestWorkerMessage.ready(4, 12, 30).toData()));

    Assert.areEqual(TestWorkerMessageKind.Ready, message.kind);
    Assert.areEqual(4, message.classCount);
    Assert.areEqual(12, message.methodCount);
    Assert.areEqual(30, message.discoveredCount);
  }

  @TestMethod
  public carriesAStartedTest(): void {
    const message = TestWorkerMessage.from(structuredClone(TestWorkerMessage.started(2, 5).toData()));

    Assert.areEqual(TestWorkerMessageKind.Started, message.kind);
    Assert.areEqual(2, message.classIndex);
    Assert.areEqual(5, message.methodIndex);
  }

  @TestMethod
  public carriesACompletedTest(): void {
    const result = new TestWorkerResult(new TestMethodResult("Sample", "SampleTests", "fails", undefined, [], TestOutcome.Failed, 7.5, "failed",
      undefined));

    const message = TestWorkerMessage.from(structuredClone(TestWorkerMessage.methodCompleted(3, 1, result).toData()));

    Assert.areEqual(TestWorkerMessageKind.MethodCompleted, message.kind);
    Assert.areEqual(3, message.classIndex);
    Assert.areEqual(1, message.methodIndex);
    Assert.areEqual("SampleTests.fails", message.result?.methodResult.displayName);
    Assert.areEqual("failed", message.result?.methodResult.failure);
    Assert.areEqual(7.5, message.result?.methodResult.durationMilliseconds);
  }

  @TestMethod
  public carriesATimedOutTest(): void {
    const message = TestWorkerMessage.from(structuredClone(TestWorkerMessage.timedOut(1, 4, "sample.test.js").toData()));

    Assert.areEqual(TestWorkerMessageKind.TimedOut, message.kind);
    Assert.areEqual(1, message.classIndex);
    Assert.areEqual(4, message.methodIndex);
    Assert.areEqual("sample.test.js", message.filePath);
  }

  @TestMethod
  public carriesACompletedClass(): void {
    const message = TestWorkerMessage.from(structuredClone(TestWorkerMessage.classCompleted(3, "sample.test.js").toData()));

    Assert.areEqual(TestWorkerMessageKind.ClassCompleted, message.kind);
    Assert.areEqual(3, message.classIndex);
    Assert.areEqual("sample.test.js", message.filePath);
    Assert.isUndefined(message.result);
  }

  @TestMethod
  public rejectsAnUnknownKind(): void {
    Assert.throws(() => TestWorkerMessage.from({ kind: "Paused" }), TestingException);
  }
}
