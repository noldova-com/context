/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestData, TestMethod, TestOutcome, TestTimeRecord, TestTimingCheck } from "@noldova/context.testing";

@TestClass
export class TestTimingCheckTests {
  @TestMethod
  public takesTheMiddleValueOrTheMeanOfTheTwoMiddleValues(): void {
    Assert.areEqual(5, TestTimingCheck.median([9, 1, 5]));
    Assert.areEqual(4, TestTimingCheck.median([7, 1, 3, 5]));
    Assert.isUndefined(TestTimingCheck.median([]));
  }

  @TestMethod
  public timesAFileByTheMedianOfItsRunsSumsSoOneSlowRunDecidesNothing(): void {
    const run = (first: number, second: number): TestTimeRecord[] => [
      TestTimingCheckTests.record("a.test.js", "adds", first),
      TestTimingCheckTests.record("a.test.js", "subtracts", second)
    ];

    const [timing] = new TestTimingCheck(1000, 0.5, new Map()).judge([run(400, 500), run(4000, 4000), run(500, 600)]);

    Assert.areEqual("Sample/a.test.js", timing?.file);
    Assert.areEqual(1100, timing?.medianMilliseconds);
    Assert.areEqual(1500, timing?.limitMilliseconds);
    Assert.isFalse(timing?.isOver ?? true);
  }

  @TestMethod
  public failsAnUnlistedFileOverTheBudgetAndAListedOneOnlyOverItsOwnTime(): void {
    const runs = [[TestTimingCheckTests.record("slow.test.js", "waits", 3000), TestTimingCheckTests.record("fast.test.js", "adds", 1300)]];

    const timings = new TestTimingCheck(1000, 0.2, new Map([["Sample/slow.test.js", 2600]])).judge(runs);

    Assert.areEqual("Sample/fast.test.js:1200:over,Sample/slow.test.js:3120:listed", timings.map(t =>
      `${t.file}:${t.limitMilliseconds}:${t.isOver ? "over" : t.isListed ? "listed" : "fits"}`).join());
  }

  @TestMethod
  public marksAListedFileWithinTheBudgetAsStaleAndCountsItInTheSummary(): void {
    const runs = [[TestTimingCheckTests.record("fast.test.js", "adds", 1100), TestTimingCheckTests.record("slow.test.js", "waits", 1300)]];

    const timings = new TestTimingCheck(1000, 0.2, new Map([["Sample/fast.test.js", 2600], ["Sample/slow.test.js", 2600]])).judge(runs);

    Assert.areEqual("Sample/fast.test.js:1200:stale,Sample/slow.test.js:1200:listed", timings.map(t =>
      `${t.file}:${t.budgetLimitMilliseconds}:${t.isStale ? "stale" : "listed"}`).join());
    Assert.areEqual("Timed 2 test files over 3 runs; 0 over their limit, 1 listed but within the budget.", TestTimingCheck.formatSummary(timings, 3));
  }

  @TestMethod
  public readsTheListedFilesAfterTheHeadingUpToTheFirstLineThatIsNeitherARowNorBlank(): void {
    const markdown = [
      "Some text.",
      "| `Sample/early.test.js` | 100 ms |",
      "Test files slower than the timing check's budget:",
      String.empty,
      "| File | Listed time |",
      "|---|---|",
      "| `Sample/slow.test.js` | 6900 ms |",
      "| `Sample/slower.test.js` | 14000 ms | why |",
      String.empty,
      "| `Sample/after-blank.test.js` | 3500 ms |",
      "The next paragraph.",
      "| `Sample/late.test.js` | 100 ms |"
    ].join("\r\n");

    const listed = TestTimingCheck.readListed(markdown);

    Assert.areEqual("Sample/slow.test.js:6900,Sample/slower.test.js:14000,Sample/after-blank.test.js:3500",
      [...listed].map(([file, milliseconds]) => `${file}:${milliseconds}`).join());
  }

  @TestMethod
  public readsNoListedFilesWithoutTheHeading(): void {
    Assert.areEqual(0, TestTimingCheck.readListed("| `Sample/slow.test.js` | 6900 ms |\n").size);
  }

  @TestMethod
  public failsAListedFileNoRunRan(): void {
    const [timing] = new TestTimingCheck(1000, 0.2, new Map([["Sample/gone.test.js", 2000]])).judge([[]]);

    Assert.areEqual("Sample/gone.test.js", timing?.file);
    Assert.isTrue(timing?.isOver ?? false);
  }

  @TestData(0)
  @TestData(Number.POSITIVE_INFINITY)
  @TestMethod
  public rejectsABudgetThatIsNotPositiveAndFinite(budgetMilliseconds: number): void {
    Assert.throws(() => new TestTimingCheck(budgetMilliseconds, 0.2, new Map()), ArgumentOutOfRangeException);
  }

  @TestData(-0.1)
  @TestData(Number.NaN)
  @TestMethod
  public rejectsAMarginThatIsNegativeOrNotFinite(margin: number): void {
    Assert.throws(() => new TestTimingCheck(1000, margin, new Map()), ArgumentOutOfRangeException);
  }

  private static record(filePath: string, methodName: string, durationMilliseconds: number): TestTimeRecord {
    return new TestTimeRecord("Sample", filePath, "SampleTests", methodName, undefined, TestOutcome.Passed, durationMilliseconds);
  }
}
