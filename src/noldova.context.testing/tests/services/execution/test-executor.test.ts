/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import {
  Assert,
  AssertFailedException,
  DiscoveredTestClass,
  DiscoveredTestMethod,
  TestClass,
  TestExecutor,
  TestingException,
  TestMethod,
  TestOutcome,
  TestTimeoutException
} from "@noldova/context.testing";

import { ExecutionFixture } from "../../fixtures/execution/execution-fixture.fixture.js";
import { FakeClock } from "../../fixtures/execution/fake-clock.fixture.js";
import { RecordingMethodProgress } from "../../fixtures/execution/recording-method-progress.fixture.js";
import { RecordingTestProgress } from "../../fixtures/execution/recording-test-progress.fixture.js";

@TestClass
export class TestExecutorTests {
  @TestMethod
  public async reportsEachMethodAsItStartsAndCompletesAsync(): Promise<void> {
    const testClass = new DiscoveredTestClass("TestPackage", "ExecutionFixtureTests", "inline://fixture", ExecutionFixture, undefined, [
      new DiscoveredTestMethod("increments", undefined, [], undefined),
      new DiscoveredTestMethod("throwsAnError", undefined, [], undefined),
    ]);
    const progress = new RecordingMethodProgress();

    await new TestExecutor(1000).executeAsync([testClass], progress);

    Assert.areEqual("start:ExecutionFixtureTests.increments,complete:increments:Passed,start:ExecutionFixtureTests.throwsAnError,"
      + "complete:throwsAnError:Failed,class:ExecutionFixtureTests", progress.events.join());
  }

  @TestMethod
  public async recordsAStoppedMethodAsTimedOutWithoutRunningItAsync(): Promise<void> {
    const events: string[] = [];
    const stoppedMethod = new DiscoveredTestMethod("recordsExecution", 0, [events, "stopped"], undefined);
    const testClass = new DiscoveredTestClass("TestPackage", "ExecutionFixtureTests", "inline://fixture", ExecutionFixture, undefined, [
      stoppedMethod,
      new DiscoveredTestMethod("recordsExecution", 1, [events, "runs"], undefined),
    ]);

    const [stoppedResult, runResult] = (await new TestExecutor(250).executeAsync([testClass], undefined, new Set([stoppedMethod])))[0]!.methodResults;

    Assert.areEqual(TestOutcome.Failed, stoppedResult!.outcome);
    const failure = stoppedResult!.failure;
    Assert.isInstanceOf(failure, TestTimeoutException);
    Assert.areEqual(250, failure.timeoutMilliseconds);
    Assert.areEqual(250, stoppedResult!.durationMilliseconds);
    Assert.areEqual(TestOutcome.Passed, runResult!.outcome);
    Assert.areEqual("run:runs", events.join());
  }

  @TestMethod
  public async completesTheCurrentClassAndRunsNothingMoreOnceStoppedAsync(): Promise<void> {
    const events: string[] = [];
    let isStopping = false;
    const first = new DiscoveredTestClass("TestPackage", "FirstTests", "inline://first", ExecutionFixture, undefined,
      [new DiscoveredTestMethod("recordsExecution", 0, [events, "first"], undefined)]);
    const second = new DiscoveredTestClass("TestPackage", "SecondTests", "inline://second", ExecutionFixture, undefined,
      [new DiscoveredTestMethod("recordsExecution", 0, [events, "second"], undefined)]);

    const classResults = await new TestExecutor(1000).executeAsync([first, second],
      { onMethodCompleted: () => { isStopping = true; }, onClassCompleted: t => { events.push(`complete:${t.className}`); } }, new Set(), () => isStopping);

    Assert.areEqual("run:first,complete:FirstTests", events.join());
    Assert.areEqual(1, classResults.length);
  }

  @TestMethod
  public rejectsANonPositiveTimeout(): void {
    Assert.throws(() => {
      new TestExecutor(0);
    }, ArgumentOutOfRangeException);
  }

  @TestMethod
  public rejectsAFractionalTimeout(): void {
    Assert.throws(() => {
      new TestExecutor(10.5);
    }, ArgumentOutOfRangeException);
  }

  @TestMethod
  public async executesEveryMethodOnAFreshInstanceAsync(): Promise<void> {
    const results = await this.executeAsync(["increments", "incrementsAgain"]);

    Assert.areEqual(TestOutcome.Passed, results.get("increments"));
    Assert.areEqual(TestOutcome.Passed, results.get("incrementsAgain"));
  }

  @TestMethod
  public async executesEveryDataRowIndependentlyOnAFreshInstanceAsync(): Promise<void> {
    const testClass = new DiscoveredTestClass("TestPackage", "ExecutionFixtureTests", "inline://fixture", ExecutionFixture, undefined, [
      new DiscoveredTestMethod("receivesData", 0, ["a", 1], undefined),
      new DiscoveredTestMethod("receivesData", 1, ["second", 6], undefined),
      new DiscoveredTestMethod("receivesDataAsync", 0, ["async"], undefined),
    ]);
    const classResults = await new TestExecutor(1000).executeAsync([testClass]);
    const methodResults = classResults[0]?.methodResults ?? [];

    Assert.areEqual(3, methodResults.length);
    Assert.isTrue(methodResults.every(t => t.outcome === TestOutcome.Passed));
    Assert.areEqual<number | undefined>(0, methodResults[0]?.testDataIndex);
    Assert.areEqual<unknown>("a", methodResults[0]?.testData[0]);
    Assert.areEqual<number | undefined>(1, methodResults[1]?.testDataIndex);
  }

  @TestMethod
  public async classifiesFailuresAndAsynchronousWorkAsync(): Promise<void> {
    const results = await this.executeAsync(["failsOnAssertion", "throwsAnError", "resolvesLaterAsync", "rejectsAsync"]);

    Assert.areEqual(TestOutcome.Failed, results.get("failsOnAssertion"));
    Assert.areEqual(TestOutcome.Failed, results.get("throwsAnError"));
    Assert.areEqual(TestOutcome.Passed, results.get("resolvesLaterAsync"));
    Assert.areEqual(TestOutcome.Failed, results.get("rejectsAsync"));
  }

  @TestMethod
  public async attributesAStrayRejectionToItsTestAsync(): Promise<void> {
    const results = await this.executeAsync(["leavesAStrayRejection"]);

    Assert.areEqual(TestOutcome.Failed, results.get("leavesAStrayRejection"));
  }

  @TestMethod
  public rejectsAnUnhandledRejectionOutsideTestExecution(): void {
    const failure = new Error("outside");

    Assert.areEqual(failure, Assert.throws(() => {
      new ExecutionFixture().emitUnhandledRejectionOutsideTestExecution(failure);
    }, Error));
  }

  @TestMethod
  public async failsAHangingTestThroughTheTimeoutAsync(): Promise<void> {
    const testClass = this.discoveredClass(["hangsAsync"], undefined);
    const clock = new FakeClock();
    const executing = new TestExecutor(100, clock).executeAsync([testClass]);
    clock.advance(100);
    const classResults = await executing;
    const methodResult = classResults[0]?.methodResults[0];

    Assert.isDefined(methodResult);
    Assert.areEqual(TestOutcome.Failed, methodResult.outcome);
    Assert.isInstanceOf(methodResult.failure, TestTimeoutException);
    Assert.areEqual(100, methodResult.durationMilliseconds);
  }

  @TestMethod
  public async reportsANonCallableMethodAsAFrameworkFailureAsync(): Promise<void> {
    const testClass = this.discoveredClass(["missing"], undefined);
    const classResults = await new TestExecutor(1000).executeAsync([testClass]);
    const methodResult = classResults[0]?.methodResults[0];

    Assert.isDefined(methodResult);
    Assert.areEqual(TestOutcome.Failed, methodResult.outcome);
    Assert.isInstanceOf(methodResult.failure, TestingException);
  }

  @TestMethod
  public async skipsAMethodWithAReasonAsync(): Promise<void> {
    const testClass = new DiscoveredTestClass(
      "TestPackage",
      "ExecutionFixtureTests",
      "inline://fixture",
      ExecutionFixture,
      undefined,
      [new DiscoveredTestMethod("increments", undefined, [], "pending")]);
    const classResults = await new TestExecutor(1000).executeAsync([testClass]);
    const methodResult = classResults[0]?.methodResults[0];

    Assert.isDefined(methodResult);
    Assert.areEqual(TestOutcome.Skipped, methodResult.outcome);
    Assert.areEqual<string | undefined>("pending", methodResult.skipReason);
    Assert.areEqual<string | undefined>("TestPackage", methodResult.packageName);
    Assert.areEqual<string | undefined>("TestPackage", classResults[0]?.packageName);
  }

  @TestMethod
  public async skipsADataRowWithItsIdentityAsync(): Promise<void> {
    const testClass = new DiscoveredTestClass("TestPackage", "ExecutionFixtureTests", "inline://fixture", ExecutionFixture, undefined, [
      new DiscoveredTestMethod("receivesData", 0, ["value", 5], "pending"),
    ]);
    const classResults = await new TestExecutor(1000).executeAsync([testClass]);
    const methodResult = classResults[0]?.methodResults[0];

    Assert.isDefined(methodResult);
    Assert.areEqual(TestOutcome.Skipped, methodResult.outcome);
    Assert.areEqual("ExecutionFixtureTests.receivesData[0]", methodResult.displayName);
  }

  @TestMethod
  public async skipsEveryMethodOfASkippedClassAsync(): Promise<void> {
    const testClass = this.discoveredClass(["increments", "failsOnAssertion"], "the fixture is pending");
    const classResults = await new TestExecutor(1000).executeAsync([testClass]);

    Assert.isTrue(classResults[0]?.methodResults.every(t => t.outcome === TestOutcome.Skipped) ?? false);
  }

  @TestMethod
  public async carriesTheAssertionFailureAsync(): Promise<void> {
    const testClass = this.discoveredClass(["failsOnAssertion"], undefined);
    const classResults = await new TestExecutor(1000).executeAsync([testClass]);

    Assert.isInstanceOf(classResults[0]?.methodResults[0]?.failure, AssertFailedException);
  }

  @TestMethod
  public rejectsATimeoutBeyondTheHostLimit(): void {
    const failure = Assert.throws(() => new TestExecutor(2_147_483_648), ArgumentOutOfRangeException);
    Assert.areEqual("timeoutMilliseconds", failure.parameterName);
  }

  @TestMethod
  public async acceptsTheMaximumHostTimeoutAsync(): Promise<void> {
    const result = await new TestExecutor(2_147_483_647).executeAsync([this.discoveredClass(["increments"], undefined)]);
    Assert.areEqual(TestOutcome.Passed, result[0]?.methodResults[0]?.outcome);
  }

  @TestMethod
  public async preservesThePrimaryFailureWhenARejectionAlsoOccursAsync(): Promise<void> {
    const result = await new TestExecutor(1000).executeAsync([this.discoveredClass(["throwsAndRejects"], undefined)]);
    const failure = result[0]?.methodResults[0]?.failure;
    Assert.isInstanceOf(failure, Error);
    Assert.areEqual("primary", failure.message);
  }

  @TestMethod
  public async reportsEachClassBeforeTheNextClassRunsAsync(): Promise<void> {
    const progress = new RecordingTestProgress();
    const first = new DiscoveredTestClass("TestPackage", "FirstTests", "inline://first", ExecutionFixture, undefined, [
      new DiscoveredTestMethod("recordsExecution", 0, [progress.events, "first"], undefined)]);
    const second = new DiscoveredTestClass("TestPackage", "SecondTests", "inline://second", ExecutionFixture, undefined, [
      new DiscoveredTestMethod("recordsExecution", 0, [progress.events, "second"], undefined),
      new DiscoveredTestMethod("failsOnAssertion", undefined, [], undefined)]);

    const classResults = await new TestExecutor(1000).executeAsync([first, second], progress);

    Assert.areEqual("run:first,complete:FirstTests,run:second,complete:SecondTests", progress.events.join(","));
    Assert.areEqual(classResults[0], progress.results[0]);
    Assert.areEqual(classResults[1], progress.results[1]);
    Assert.areEqual(TestOutcome.Failed, progress.results[1]?.methodResults[1]?.outcome);
  }

  @TestMethod
  public async rejectsWithAListenerFailureAndRemovesItsRejectionListenerAsync(): Promise<void> {
    const failure = new Error("completion output failed");
    const listenerCount = process.listenerCount("unhandledRejection");

    const thrown = await Assert.throwsAsync(
      () => new TestExecutor(1000).executeAsync([this.discoveredClass(["increments"], undefined)], new RecordingTestProgress(failure)),
      Error);

    Assert.areEqual(failure, thrown);
    Assert.areEqual(listenerCount, process.listenerCount("unhandledRejection"));
  }

  private discoveredClass(methodNames: readonly string[], skipReason: string | undefined): DiscoveredTestClass {
    return new DiscoveredTestClass(
      "TestPackage",
      "ExecutionFixtureTests",
      "inline://fixture",
      ExecutionFixture,
      skipReason,
      methodNames.map(t => new DiscoveredTestMethod(t, undefined, [], undefined)));
  }

  private async executeAsync(methodNames: readonly string[]): Promise<Map<string, TestOutcome>> {
    const classResults = await new TestExecutor(5000).executeAsync([this.discoveredClass(methodNames, undefined)]);
    const outcomes = new Map<string, TestOutcome>();
    for (const classResult of classResults)
      for (const methodResult of classResult.methodResults)
        outcomes.set(methodResult.methodName, methodResult.outcome);

    return outcomes;
  }
}
