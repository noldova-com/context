/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { join } from "node:path";

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import {
  Assert, AssertFailedException, ParallelTestRunner, TestClass, TestData, TestDiscovery, TestExecutor, TestMethod,
  TestReportWriter, TestRunner, type TestRunResult, TestTimeoutException
} from "@noldova/context.testing";

import { FakeClock } from "../../fixtures/execution/fake-clock.fixture.js";
import { FixtureTestProject } from "../../fixtures/execution/fixture-test-project.fixture.js";
import { RecordingMethodProgress } from "../../fixtures/execution/recording-method-progress.fixture.js";

@TestClass
export class ParallelTestRunnerTests {
  private static readonly TIMEOUT_MILLISECONDS: number = 60_000;
  private static readonly START_LIMIT_MILLISECONDS: number = 60_250;
  private static readonly HANGING_TEST_WATCHDOG: number = 6;
  private static readonly LOOPING_TEST_WATCHDOG: number = 19;

  @TestData(0)
  @TestData(2_147_483_647)
  @TestMethod
  public rejectsATimeoutOutOfRange(timeoutMilliseconds: number): void {
    Assert.throws(() => new ParallelTestRunner(timeoutMilliseconds), ArgumentOutOfRangeException);
  }

  @TestData(0)
  @TestData(1.5)
  @TestMethod
  public rejectsAWorkerCountThatIsNotAPositiveInteger(workerCount: number): void {
    Assert.throws(() => new ParallelTestRunner(ParallelTestRunnerTests.TIMEOUT_MILLISECONDS, workerCount), ArgumentOutOfRangeException);
  }

  @TestMethod
  public async returnsTheResultsTheRunnerReturnsInOneProcessAndTellsItsListenerInDiscoveryOrderAsync(): Promise<void> {
    const project = await FixtureTestProject.createAsync(["mixed-results-fixture", "passing-fixture"]);
    const progress = new RecordingMethodProgress();
    try {
      const inOneProcess = await new TestRunner(new TestDiscovery(), new TestExecutor(ParallelTestRunnerTests.TIMEOUT_MILLISECONDS))
        .runAsync([project.testProject]);

      const inWorkers = await new ParallelTestRunner(ParallelTestRunnerTests.TIMEOUT_MILLISECONDS, 2, new FakeClock())
        .runAsync([project.testProject], [], progress);

      Assert.areEqual(ParallelTestRunnerTests.describe(inOneProcess), ParallelTestRunnerTests.describe(inWorkers));
      Assert.areEqual(4, inWorkers.passed);
      Assert.areEqual(4, inWorkers.failed);
      Assert.areEqual(1, inWorkers.skipped);
      Assert.isInstanceOf(inWorkers.classResults[0]?.methodResults[0]?.failure, AssertFailedException);
      Assert.areEqual(9, progress.events.filter(t => t.startsWith("complete:")).length);
      Assert.areEqual("class:MixedResultsFixtureTests,class:PassingFixtureTests", progress.events.filter(t => t.startsWith("class:")).join());
      Assert.isFalse(progress.events.some(t => t.startsWith("start:")));
    }
    finally {
      await project.removeAsync();
    }
  }

  @TestMethod
  public async stopsATestThatNeverSettlesAndOneThatBlocksAndRunsTheRestAsync(): Promise<void> {
    const clock = new FakeClock();
    clock.fireOnceArmed(ParallelTestRunnerTests.HANGING_TEST_WATCHDOG, ParallelTestRunnerTests.LOOPING_TEST_WATCHDOG);
    const project = await FixtureTestProject.createAsync(["hanging-fixture", "looping-fixture", "passing-fixture"]);
    try {
      const result = await new ParallelTestRunner(ParallelTestRunnerTests.TIMEOUT_MILLISECONDS, 1, clock).runAsync([project.testProject]);

      Assert.areEqual("HangingFixtureTests.hangsAsync Failed,HangingFixtureTests.passes Passed,LoopingFixtureTests.finishesFirst Passed,"
        + "LoopingFixtureTests.loopsForever Failed,LoopingFixtureTests.passesAfterTheLoop Passed,PassingFixtureTests.passes Passed",
        ParallelTestRunnerTests.outcomes(result));
      Assert.isInstanceOf(result.classResults[0]?.methodResults[0]?.failure, TestTimeoutException);
      Assert.isInstanceOf(result.classResults[1]?.methodResults[1]?.failure, TestTimeoutException);
    }
    finally {
      await project.removeAsync();
    }
  }

  @TestMethod
  public async failsTheRunWhenATestEndsItsWorkerAsync(): Promise<void> {
    const error = await ParallelTestRunnerTests.failAsync(["exiting-fixture"], () => undefined);

    Assert.areEqual("The test worker ended with exit code 3 before the run finished.", error.message);
  }

  @TestMethod
  public async failsTheRunWithTheErrorOfATestModuleThatThrowsOnImportAsync(): Promise<void> {
    const error = await ParallelTestRunnerTests.failAsync(["throwing-module-fixture"], () => undefined);

    Assert.areEqual("The fixture module failed to load.", error.message);
  }

  @TestMethod
  public async failsTheRunWhenAWorkerStartsNoTestWithinItsLimitAsync(): Promise<void> {
    const error = await ParallelTestRunnerTests.failAsync(["stalling-fixture"], t => t.advance(ParallelTestRunnerTests.START_LIMIT_MILLISECONDS));

    Assert.areEqual("The test worker started no test within 60250 milliseconds.", error.message);
  }

  @TestMethod
  public async failsTheRunWhenItsWorkersDiscoverDifferentTestsAsync(): Promise<void> {
    const error = await ParallelTestRunnerTests.failAsync([], () => undefined, async t => FixtureTestProject.writeTestFileAsync(t,
      "varying-fixture.test.js", "varying-fixture", `?claim=${encodeURIComponent(join(t, "claimed.txt"))}`), 2);

    Assert.isTrue(error.message.startsWith("The test workers discovered different tests"), error.message);
  }

  @TestMethod
  public async failsTheRunWhenAClassLeavesAResourceOpenAsync(): Promise<void> {
    const error = await ParallelTestRunnerTests.failAsync(["leaking-timer-fixture"], () => undefined);

    Assert.isTrue(error.message.includes("LeakingTimerFixtureTests left Timeout open after its tests finished"), error.message);
  }

  @TestMethod
  public async returnsAnEmptyResultWhenItsFiltersSelectNoTestAsync(): Promise<void> {
    const resourceCount = process.getActiveResourcesInfo().length;
    const project = await FixtureTestProject.createAsync(["passing-fixture"]);
    try {
      const result = await new ParallelTestRunner(ParallelTestRunnerTests.TIMEOUT_MILLISECONDS, 1, new FakeClock()).runAsync([project.testProject],
        ["NoSuchTest"]);

      Assert.areEqual(0, result.total);
      Assert.areEqual(0, result.classResults.length);
      Assert.areEqual(1, result.selection.discovered);
      Assert.areEqual(0, result.selection.selected);
    }
    finally {
      await project.removeAsync();
    }

    await ParallelTestRunnerTests.assertNothingLeftOpenAsync(resourceCount);
  }

  private static async failAsync(fixtureNames: readonly string[], act: (clock: FakeClock) => void,
    prepareAsync: (rootDirectory: string) => Promise<void> = async () => { }, workerCount: number = 1): Promise<Error> {
    const resourceCount = process.getActiveResourcesInfo().length;
    const clock = new FakeClock();
    const project = await FixtureTestProject.createAsync(fixtureNames);
    let error: Error;
    try {
      await prepareAsync(project.testProject.rootDirectory);
      const running = new ParallelTestRunner(ParallelTestRunnerTests.TIMEOUT_MILLISECONDS, workerCount, clock).runAsync([project.testProject]);
      act(clock);

      error = await Assert.throwsAsync(() => running, Error);
    }
    finally {
      await project.removeAsync();
    }

    await ParallelTestRunnerTests.assertNothingLeftOpenAsync(resourceCount);
    return error;
  }

  private static async assertNothingLeftOpenAsync(resourceCount: number): Promise<void> {
    await new Promise<void>(resolve => setImmediate(resolve));
    Assert.isTrue(process.getActiveResourcesInfo().length <= resourceCount,
      `Expected no worker left running a loop turn after the run settled; open: ${process.getActiveResourcesInfo().join()}`);
  }

  private static outcomes(result: TestRunResult): string {
    return result.classResults.flatMap(t => t.methodResults.map(u => `${u.displayName} ${u.outcome}`)).join();
  }

  private static describe(result: TestRunResult): string {
    const writer = new TestReportWriter();
    return [
      `${result.selection.discovered} ${result.selection.selected}`,
      ...result.classResults.flatMap(t => [
        `${t.packageName}/${t.filePath} ${t.className}`,
        ...t.methodResults.flatMap(u => [
          `${u.displayName} ${u.outcome} ${String(u.skipReason)}`,
          ...writer.formatMethodLines(u, false).map(v => v.replace(/\(\d+ ms\)/u, String.empty)),
        ]),
      ]),
    ].join("\n");
  }
}
