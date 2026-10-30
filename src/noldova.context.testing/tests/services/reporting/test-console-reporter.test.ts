/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import {
  Assert,
  AssertFailedException,
  TestClass,
  TestClassResult,
  TestConsoleReporter,
  TestData,
  TestMethod,
  TestMethodResult,
  TestOutcome,
  TestReportWriter,
  TestRunResult,
  TestRunTotals,
  TestSelection
} from "@noldova/context.testing";

import { FakeClock } from "../../fixtures/execution/fake-clock.fixture.js";

@TestClass
export class TestConsoleReporterTests {
  private static readonly CLEAR_LINE: string = "\r\u001b[2K";

  @TestMethod
  public writesLinesAWorkerFormattedAndTotalsItCounted(): void {
    const output: string[] = [];
    const reporter = new TestConsoleReporter(t => output.push(t), false, false);

    reporter.writeClassLines(["TestPackage/remote.test.js — RemoteTests", "  line", ""]);
    reporter.writeClassLines([]);
    reporter.writeSummary(new TestRunTotals(2, 1, 0, 5));

    Assert.areEqual(2, output.length);
    Assert.areEqual("TestPackage/remote.test.js — RemoteTests\n  line\n\n", output[0]);
    Assert.isTrue(output[1]?.startsWith("----------------------------------------\nTotal:      3\n") ?? false);
  }

  @TestMethod
  public writesTheSelectionOfAFilteredRun(): void {
    const output: string[] = [];
    const reporter = new TestConsoleReporter(t => output.push(t), false, false);

    reporter.writeSummary(new TestRunTotals(1, 0, 0, 5), new TestSelection(["Alpha"], 3, 1));

    Assert.isTrue(output[0]?.includes("\nDiscovered: 3\nSelected:   1\nUnselected: 2\n") ?? false, output.join());
  }

  @TestMethod
  public writesEachClassWhenItFinishesAndTheTotalsLast(): void {
    const output: string[] = [];
    const reporter = new TestConsoleReporter(t => output.push(t), false, false);
    const first = this.classResult("FirstTests", TestOutcome.Passed);
    const second = this.classResult("SecondTests", TestOutcome.Failed);

    reporter.start();
    reporter.onClassCompleted(first);
    reporter.onClassCompleted(second);
    reporter.writeSummary(new TestRunResult([first, second]));

    Assert.areEqual(3, output.length);
    Assert.isTrue(output[0]?.startsWith("TestPackage/firsttests.test.js — FirstTests\n") ?? false);
    Assert.isTrue(output[1]?.startsWith("TestPackage/secondtests.test.js — SecondTests\n") ?? false);
    Assert.isTrue(output[2]?.startsWith("----------------------------------------\nTotal:      2\n") ?? false);
    Assert.isTrue(output.every(t => t.endsWith("\n") && !t.includes("\u001b[2K")));
  }

  @TestMethod
  @TestData(false)
  @TestData(true)
  public writesExactlyTheWholeReportOutsideATerminal(skipPassingDetails: boolean): void {
    const passed = new TestClassResult("TestPackage", "GreenTests", "green.test.js", [
      new TestMethodResult("TestPackage", "GreenTests", "passes", undefined, [], TestOutcome.Passed, 1, undefined, undefined)]);
    const mixed = new TestClassResult("TestPackage", "MixedTests", "mixed.test.js", [
      new TestMethodResult("TestPackage", "MixedTests", "accepts", 0, ["value"], TestOutcome.Passed, 3, undefined, undefined),
      new TestMethodResult("TestPackage", "MixedTests", "fails", undefined, [], TestOutcome.Failed, 2, new AssertFailedException("mismatch", 1, 2), undefined),
      new TestMethodResult("TestPackage", "MixedTests", "skips", undefined, [], TestOutcome.Skipped, 0, undefined, "pending")]);
    const result = new TestRunResult([passed, mixed]);
    const expected = [
      ...(skipPassingDetails ? [] : ["TestPackage/green.test.js — GreenTests", "  \u001b[32m✓\u001b[0m passes (1 ms)", ""]),
      "TestPackage/mixed.test.js — MixedTests",
      ...(skipPassingDetails ? [] : ["  \u001b[32m✓\u001b[0m accepts[0](\"value\") (3 ms)"]),
      "  \u001b[31m✘\u001b[0m fails (2 ms)",
      "    AssertFailedException: mismatch",
      "    expected: 1",
      "    actual:   2",
      "  \u001b[33m○\u001b[0m skips — skipped: pending",
      "",
      "----------------------------------------",
      "Total:      4",
      "Time:       6 ms",
      "\u001b[32mPassed:     2\u001b[0m",
      "\u001b[31mFailed:     1\u001b[0m",
      "\u001b[33mSkipped:    1\u001b[0m"];
    const output: string[] = [];
    const reporter = new TestConsoleReporter(t => output.push(t), false, skipPassingDetails);

    reporter.start();
    reporter.onClassCompleted(passed);
    reporter.onClassCompleted(mixed);
    reporter.writeSummary(result);

    Assert.areEqual(`${expected.join("\n")}\n`, output.join(""));
    Assert.areEqual(`${new TestReportWriter().formatLines(result, skipPassingDetails).join("\n")}\n`, output.join(""));
  }

  @TestMethod
  public writesNothingForAFullyPassingClassWhenPassingDetailsAreHidden(): void {
    const output: string[] = [];
    const reporter = new TestConsoleReporter(t => output.push(t), false, true);

    reporter.onClassCompleted(this.classResult("QuietTests", TestOutcome.Passed));
    Assert.areEqual(0, output.length);

    reporter.onClassCompleted(this.classResult("LoudTests", TestOutcome.Failed));
    Assert.areEqual(1, output.length);
    Assert.isTrue(output[0]?.startsWith("TestPackage/loudtests.test.js — LoudTests\n") ?? false);
  }

  @TestMethod
  public keepsTheProgressLineBelowWhatItWritesInATerminal(): void {
    const output: string[] = [];
    const reporter = new TestConsoleReporter(t => output.push(t), true, true);
    const quiet = this.classResult("QuietTests", TestOutcome.Passed);
    const loud = this.classResult("LoudTests", TestOutcome.Failed);

    reporter.start();
    reporter.onClassCompleted(quiet);
    reporter.onClassCompleted(loud);
    reporter.writeSummary(new TestRunResult([quiet, loud]));

    Assert.areEqual(6, output.length);
    Assert.areEqual(`${TestConsoleReporterTests.CLEAR_LINE}Running tests.`, output[0]);
    Assert.areEqual(TestConsoleReporterTests.CLEAR_LINE, output[1]);
    Assert.isTrue(output[2]?.startsWith("TestPackage/loudtests.test.js — LoudTests\n") ?? false);
    Assert.areEqual(`${TestConsoleReporterTests.CLEAR_LINE}Running tests.`, output[3]);
    Assert.areEqual(TestConsoleReporterTests.CLEAR_LINE, output[4]);
    Assert.isTrue(output[5]?.startsWith("----------------------------------------\nTotal:      2\n") ?? false);
  }

  @TestMethod
  public animatesTheProgressLineUntilItStops(): void {
    const output: string[] = [];
    const clock = new FakeClock();
    const reporter = new TestConsoleReporter(t => output.push(t), true, false, clock);

    reporter.start();
    clock.advance(299);
    const firstCount = output.length;
    clock.advance(1);
    const secondCount = output.length;
    clock.advance(300);
    reporter.stop();
    const writtenCount = output.length;
    clock.advance(600);

    Assert.areEqual(1, firstCount);
    Assert.areEqual(2, secondCount);
    Assert.areEqual(`${TestConsoleReporterTests.CLEAR_LINE}Running tests.`, output[0]);
    Assert.areEqual(`${TestConsoleReporterTests.CLEAR_LINE}Running tests..`, output[1]);
    Assert.areEqual(`${TestConsoleReporterTests.CLEAR_LINE}Running tests...`, output[2]);
    Assert.areEqual(TestConsoleReporterTests.CLEAR_LINE, output.at(-1));
    Assert.areEqual(4, writtenCount);
    Assert.areEqual(writtenCount, output.length);
  }

  @TestMethod
  public animatesOnATimerThatNeverKeepsTheProcessAlive(): void {
    const output: string[] = [];
    const reporter = new TestConsoleReporter(t => output.push(t), true, false);
    const timeouts = process.getActiveResourcesInfo().filter(t => t === "Timeout").length;

    reporter.start();
    const timeoutsWhileAnimating = process.getActiveResourcesInfo().filter(t => t === "Timeout").length;
    reporter.stop();

    Assert.areEqual(timeouts, timeoutsWhileAnimating);
    Assert.areEqual(2, output.length);
  }

  @TestMethod
  public removesTheProgressLineOnlyOnce(): void {
    const output: string[] = [];
    const reporter = new TestConsoleReporter(t => output.push(t), true, false);

    reporter.start();
    reporter.stop();
    reporter.stop();

    Assert.areEqual(2, output.length);
    Assert.areEqual(TestConsoleReporterTests.CLEAR_LINE, output[1]);
  }

  @TestMethod
  public stopsWithoutWritingWhenNoProgressLineIsShown(): void {
    const output: string[] = [];
    const reporter = new TestConsoleReporter(t => output.push(t), false, false);

    reporter.start();
    reporter.stop();

    Assert.areEqual(0, output.length);
  }

  private classResult(className: string, outcome: TestOutcome): TestClassResult {
    const failure = outcome === TestOutcome.Failed ? new Error("boom") : undefined;
    return new TestClassResult("TestPackage", className, `${className.toLowerCase()}.test.js`, [
      new TestMethodResult("TestPackage", className, "runs", undefined, [], outcome, 1, failure, undefined)]);
  }
}
