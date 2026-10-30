/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import {
  Assert, TestClass, TestConsoleReporter, TestData, TestMethod, TestMethodResult, TestOutcome
} from "@noldova/context.testing";
import { TestWorkerMessage } from "@noldova/context.testing/models/execution/test-worker-message.js";
import { TestWorkerResult } from "@noldova/context.testing/models/execution/test-worker-result.js";
import { TestWorkerStart } from "@noldova/context.testing/models/execution/test-worker-start.js";
import { TestRunSupervisor } from "@noldova/context.testing/services/execution/test-run-supervisor.js";

import { FakeClock } from "../../fixtures/execution/fake-clock.fixture.js";
import { RecordingTestProgress } from "../../fixtures/execution/recording-test-progress.fixture.js";
import { ScriptedWorker } from "../../fixtures/execution/scripted-worker.fixture.js";

@TestClass
export class TestRunSupervisorTests {
  private static readonly TIMEOUT_MILLISECONDS: number = 200;

  @TestData(0)
  @TestData(2_147_483_647)
  @TestMethod
  public rejectsATimeoutOutOfRange(timeoutMilliseconds: number): void {
    Assert.throws(() => new TestRunSupervisor(timeoutMilliseconds, [], [], TestRunSupervisorTests.reporter([])), ArgumentOutOfRangeException);
  }

  @TestData(0)
  @TestData(1.5)
  @TestMethod
  public rejectsAWorkerCountThatIsNotAPositiveInteger(workerCount: number): void {
    Assert.throws(() => new TestRunSupervisor(TestRunSupervisorTests.TIMEOUT_MILLISECONDS, [], [], TestRunSupervisorTests.reporter([]), undefined,
      workerCount), ArgumentOutOfRangeException);
  }

  @TestData(0)
  @TestData(2_147_483_648)
  @TestMethod
  public rejectsAStartLimitOutOfRange(startLimitMilliseconds: number): void {
    Assert.throws(() => new TestRunSupervisor(TestRunSupervisorTests.TIMEOUT_MILLISECONDS, [], [], TestRunSupervisorTests.reporter([]), undefined,
      2, startLimitMilliseconds), ArgumentOutOfRangeException);
  }

  @TestMethod
  public async reportsTheRunsElapsedTimeRatherThanTheSumOfItsTestsAsync(): Promise<void> {
    const clock = new FakeClock();
    const worker = new ScriptedWorker(passing => TestRunSupervisorTests.completeClass(passing, 0, "PassingFixtureTests"));
    const supervisor = new TestRunSupervisor(TestRunSupervisorTests.TIMEOUT_MILLISECONDS, [], [], TestRunSupervisorTests.reporter([]), undefined, 1,
      undefined, () => worker, clock);
    const running = supervisor.runAsync();
    clock.advance(42);
    worker.send(TestWorkerMessage.ready(1, 1, 1));

    const result = await running;

    Assert.areEqual(1, result.passed);
    Assert.areEqual(42, supervisor.elapsedMilliseconds);
  }

  @TestMethod
  public async writesTheClassesInOrderWhicheverWorkerFinishesFirstAsync(): Promise<void> {
    const output: string[] = [];
    const firstFinishing = Promise.withResolvers<void>();
    let writtenBeforeTheFirstClass = -1;
    const first = new ScriptedWorker(worker => void firstFinishing.promise.then(() => TestRunSupervisorTests.completeClass(worker, 0, "FirstTests")));
    const second = new ScriptedWorker(worker => {
      TestRunSupervisorTests.completeClass(worker, 1, "SecondTests");
      writtenBeforeTheFirstClass = output.length;
      firstFinishing.resolve();
    });
    const scripted = [first, second];
    const running = new TestRunSupervisor(TestRunSupervisorTests.TIMEOUT_MILLISECONDS, [], [], TestRunSupervisorTests.reporter(output),
      undefined, 2, undefined, () => scripted.shift() ?? new ScriptedWorker(() => undefined), new FakeClock()).runAsync();
    first.send(TestWorkerMessage.ready(2, 2, 2));
    second.send(TestWorkerMessage.ready(2, 2, 2));

    const totals = await running;

    const text = output.join("");
    Assert.areEqual(2, totals.passed);
    Assert.areEqual(0, writtenBeforeTheFirstClass);
    Assert.isTrue(text.includes("SecondTests") && text.indexOf("FirstTests") < text.indexOf("SecondTests"), text);
  }

  @TestMethod
  public async countsWhatItsFiltersSelectedOutOfWhatItDiscoveredAsync(): Promise<void> {
    const starts: TestWorkerStart[] = [];
    const worker = new ScriptedWorker(passing => TestRunSupervisorTests.completeClass(passing, 0, "PassingFixtureTests"));
    const supervisor = new TestRunSupervisor(TestRunSupervisorTests.TIMEOUT_MILLISECONDS, [], ["Passing"], TestRunSupervisorTests.reporter([]),
      undefined, 1, undefined, (_url, options) => {
        starts.push(TestWorkerStart.from(options.workerData));
        return worker;
      }, new FakeClock());
    const running = supervisor.runAsync();
    worker.send(TestWorkerMessage.ready(1, 1, 3));

    const totals = await running;

    Assert.areEqual(1, totals.passed);
    Assert.areEqual("Passing", starts.map(t => t.filters.join()).join());
    Assert.areEqual("Passing", supervisor.selection.filters.join());
    Assert.areEqual(3, supervisor.selection.discovered);
    Assert.areEqual(1, supervisor.selection.selected);
  }

  @TestData(0)
  @TestData(1)
  @TestMethod
  public async resumesAClassWhoseTestNeverEndsAtThatTestWithoutRunningTheOnesBeforeAsync(stoppedMethodIndex: number): Promise<void> {
    const clock = new FakeClock();
    const blocking = new ScriptedWorker(worker => {
      for (let methodIndex = 0; methodIndex < stoppedMethodIndex; methodIndex++)
        TestRunSupervisorTests.completeMethod(worker, methodIndex, TestOutcome.Passed);
      worker.send(TestWorkerMessage.started(0, stoppedMethodIndex));
      clock.fire(clock.latestTimer);
    });
    const resuming = new ScriptedWorker(worker => {
      for (let methodIndex = stoppedMethodIndex; methodIndex < 3; methodIndex++)
        TestRunSupervisorTests.completeMethod(worker, methodIndex, methodIndex === stoppedMethodIndex ? TestOutcome.Failed : TestOutcome.Passed);
      worker.send(TestWorkerMessage.classCompleted(0, "StoppedFixtureTests.test.js"));
    });
    const scripted = [blocking, resuming];
    const running = new TestRunSupervisor(TestRunSupervisorTests.TIMEOUT_MILLISECONDS, [], [], TestRunSupervisorTests.reporter([]), undefined, 1,
      undefined, () => {
        const worker = scripted.shift() ?? new ScriptedWorker(() => undefined);
        queueMicrotask(() => worker.send(TestWorkerMessage.ready(1, 3, 3)));
        return worker;
      }, clock).runAsync();

    const totals = await running;

    Assert.areEqual("0.0 false", TestRunSupervisorTests.describeRuns(blocking));
    Assert.areEqual(`0.${stoppedMethodIndex} true`, TestRunSupervisorTests.describeRuns(resuming));
    Assert.areEqual([0, 1, 2].map(t => `method${t} ${t === stoppedMethodIndex ? TestOutcome.Failed : TestOutcome.Passed}`).join(),
      totals.classResults.flatMap(t => t.methodResults.map(u => `${u.methodName} ${u.outcome}`)).join());
    Assert.areEqual(2, totals.passed);
    Assert.areEqual(1, totals.failed);
  }

  @TestMethod
  public async finishesWithoutAnotherWorkerWhenTheLastTestTimesOutAsync(): Promise<void> {
    let created = 0;
    const worker = new ScriptedWorker(timingOut => {
      TestRunSupervisorTests.completeMethod(timingOut, 0, TestOutcome.Passed);
      TestRunSupervisorTests.completeMethod(timingOut, 1, TestOutcome.Failed);
      timingOut.send(TestWorkerMessage.timedOut(0, 1, "StoppedFixtureTests.test.js"));
    });
    const running = new TestRunSupervisor(TestRunSupervisorTests.TIMEOUT_MILLISECONDS, [], [], TestRunSupervisorTests.reporter([]), undefined, 1,
      undefined, () => {
        created++;
        return worker;
      }, new FakeClock()).runAsync();
    worker.send(TestWorkerMessage.ready(1, 2, 2));

    const totals = await running;

    Assert.areEqual(1, totals.passed);
    Assert.areEqual(1, totals.failed);
    Assert.areEqual(1, created);
  }

  @TestMethod
  public async failsTheRunWhenItsWorkerReturnsFewerResultsThanItSelectedAsync(): Promise<void> {
    const worker = new ScriptedWorker(() => undefined);
    const running = new TestRunSupervisor(TestRunSupervisorTests.TIMEOUT_MILLISECONDS, [], [], TestRunSupervisorTests.reporter([]), undefined, 1,
      undefined, () => worker, new FakeClock()).runAsync();
    worker.send(TestWorkerMessage.ready(0, 1, 1));

    const error = await Assert.throwsAsync(() => running, Error);

    Assert.isTrue(error.message.includes("0 results for 1 selected tests"), error.message);
  }

  @TestData(false)
  @TestData(true)
  @TestMethod
  public async failsTheRunWithTheListenersOwnErrorAsync(isTimedOut: boolean): Promise<void> {
    const worker = new ScriptedWorker(listening => {
      listening.send(TestWorkerMessage.started(0, 0));
      listening.send(TestWorkerMessage.methodCompleted(0, 0, TestRunSupervisorTests.result("ListeningFixtureTests")));
      listening.send(isTimedOut ? TestWorkerMessage.timedOut(0, 0, "listening-fixture.test.js")
        : TestWorkerMessage.classCompleted(0, "listening-fixture.test.js"));
    });
    const running = new TestRunSupervisor(TestRunSupervisorTests.TIMEOUT_MILLISECONDS, [], [], new RecordingTestProgress(new Error("The listener failed.")),
      undefined, 1, undefined, () => worker, new FakeClock()).runAsync();
    worker.send(TestWorkerMessage.ready(1, 1, 1));

    const error = await Assert.throwsAsync(() => running, Error);

    Assert.areEqual("The listener failed.", error.message);
  }

  @TestData("MethodCompleted")
  @TestData("ClassCompleted")
  @TestMethod
  public async failsTheRunWhenItsWorkerCompletesWhatItDidNotReportAsync(kind: string): Promise<void> {
    const worker = new ScriptedWorker(misbehaving => misbehaving.emit("message", { ...TestWorkerMessage.started(0, 0).toData(), kind }));
    const running = new TestRunSupervisor(TestRunSupervisorTests.TIMEOUT_MILLISECONDS, [], [], TestRunSupervisorTests.reporter([]), undefined, 1,
      undefined, () => worker, new FakeClock()).runAsync();
    worker.send(TestWorkerMessage.ready(1, 1, 1));

    const error = await Assert.throwsAsync(() => running, Error);

    Assert.isTrue(error.message.includes("not a test worker message"), error.message);
  }

  @TestMethod
  public async waitsForAWorkerThatKeepsImportingItsTestFilesAsync(): Promise<void> {
    const clock = new FakeClock();
    const worker = new ScriptedWorker(importing => {
      importing.send(TestWorkerMessage.started(0, 0));
      importing.send(TestWorkerMessage.methodCompleted(0, 0, TestRunSupervisorTests.result("ImportingFixtureTests")));
      importing.send(TestWorkerMessage.classCompleted(0, "importing-fixture.test.js"));
    });
    const running = new TestRunSupervisor(TestRunSupervisorTests.TIMEOUT_MILLISECONDS, [], [], TestRunSupervisorTests.reporter([]), undefined, 1,
      60_000, () => worker, clock).runAsync();
    for (let file = 0; file < 3; file++) {
      clock.advance(59_999);
      worker.send(TestWorkerMessage.imported(`file-${file}.test.js`));
    }
    worker.send(TestWorkerMessage.ready(1, 1, 1));

    const totals = await running;

    Assert.areEqual(1, totals.passed);
  }

  @TestMethod
  public async failsTheRunWhenItsWorkerImportsNoFurtherFileWithinTheLimitAsync(): Promise<void> {
    const clock = new FakeClock();
    const worker = new ScriptedWorker(() => undefined);
    const running = new TestRunSupervisor(TestRunSupervisorTests.TIMEOUT_MILLISECONDS, [], [], TestRunSupervisorTests.reporter([]), undefined, 1,
      60_000, () => worker, clock).runAsync();
    clock.advance(59_999);
    worker.send(TestWorkerMessage.imported("nested/first.test.js"));
    clock.advance(60_000);

    const error = await Assert.throwsAsync(() => running, Error);

    Assert.areEqual("The test worker imported no test file and started no test within 60000 milliseconds after it imported nested/first.test.js.",
      error.message);
  }

  @TestMethod
  public async ignoresAnErrorFromAWorkerItIsStoppingAsync(): Promise<void> {
    const worker = new ScriptedWorker(stopping => {
      stopping.send(TestWorkerMessage.started(0, 0));
      stopping.send(TestWorkerMessage.methodCompleted(0, 0, TestRunSupervisorTests.result("StoppingFixtureTests")));
      stopping.send(TestWorkerMessage.timedOut(0, 0, "stopping-fixture.test.js"));
      stopping.emit("error", new Error("The worker failed after it timed out."));
    });
    const running = new TestRunSupervisor(TestRunSupervisorTests.TIMEOUT_MILLISECONDS, [], [], TestRunSupervisorTests.reporter([]), undefined, 1,
      undefined, () => worker, new FakeClock()).runAsync();
    worker.send(TestWorkerMessage.ready(1, 1, 1));

    const totals = await running;

    Assert.areEqual(1, totals.passed);
  }

  @TestMethod
  public async startsNoWorkerOnceTheRunHasFailedAsync(): Promise<void> {
    const release = Promise.withResolvers<void>();
    const timingOut = new ScriptedWorker(worker => worker.send(TestWorkerMessage.timedOut(0, 0, "")), release.promise);
    const misbehaving = new ScriptedWorker(() => undefined);
    const scripted = [timingOut, misbehaving];
    let created = 0;
    const running = new TestRunSupervisor(TestRunSupervisorTests.TIMEOUT_MILLISECONDS, [], [], TestRunSupervisorTests.reporter([]), undefined, 2,
      undefined, () => {
        created++;
        return scripted.shift() ?? new ScriptedWorker(() => undefined);
      }, new FakeClock()).runAsync();
    timingOut.send(TestWorkerMessage.ready(2, 2, 2));
    misbehaving.send(TestWorkerMessage.ready(2, 2, 2));
    await timingOut.terminating;

    misbehaving.emit("message", "not a test worker message");
    release.resolve();
    const error = await Assert.throwsAsync(() => running, Error);
    await Promise.all([timingOut.terminate(), misbehaving.terminate()]);
    await new Promise<void>(resolve => setImmediate(resolve));

    Assert.isTrue(error.message.includes("not a test worker message"), error.message);
    Assert.areEqual(2, created);
  }

  @TestMethod
  public async failsTheRunOnlyOnceItsWorkersHaveStoppedAsync(): Promise<void> {
    const release = Promise.withResolvers<void>();
    const stopping = new ScriptedWorker(() => undefined, release.promise);
    const misbehaving = new ScriptedWorker(() => undefined);
    const scripted = [stopping, misbehaving];
    const running = new TestRunSupervisor(TestRunSupervisorTests.TIMEOUT_MILLISECONDS, [], [], TestRunSupervisorTests.reporter([]), undefined, 2,
      undefined, () => scripted.shift() ?? new ScriptedWorker(() => undefined), new FakeClock()).runAsync();
    let isFailed = false;
    const failed = running.catch(() => {
      isFailed = true;
    });
    misbehaving.emit("message", "not a test worker message");
    await stopping.terminating;
    await new Promise<void>(resolve => setImmediate(resolve));
    const isFailedWhileStopping = isFailed;

    release.resolve();
    await failed;

    Assert.isFalse(isFailedWhileStopping);
    Assert.isTrue(isFailed);
  }

  private static completeClass(worker: ScriptedWorker, classIndex: number, className: string): void {
    worker.send(TestWorkerMessage.started(classIndex, 0));
    worker.send(TestWorkerMessage.methodCompleted(classIndex, 0, TestRunSupervisorTests.result(className)));
    worker.send(TestWorkerMessage.classCompleted(classIndex, `${className}.test.js`));
  }

  private static completeMethod(worker: ScriptedWorker, methodIndex: number, outcome: TestOutcome): void {
    worker.send(TestWorkerMessage.started(0, methodIndex));
    worker.send(TestWorkerMessage.methodCompleted(0, methodIndex, TestRunSupervisorTests.result("StoppedFixtureTests", `method${methodIndex}`, outcome)));
  }

  private static result(className: string, methodName: string = "passes", outcome: TestOutcome = TestOutcome.Passed): TestWorkerResult {
    return new TestWorkerResult(new TestMethodResult("FixturePackage", className, methodName, undefined, [], outcome, 1, undefined, undefined));
  }

  private static describeRuns(worker: ScriptedWorker): string {
    return worker.runs.map(t => `${t.classIndex}.${t.startMethodIndex} ${String(t.isStartMethodStopped)}`).join();
  }

  private static reporter(output: string[]): TestConsoleReporter {
    return new TestConsoleReporter(t => output.push(t), false, false);
  }
}
