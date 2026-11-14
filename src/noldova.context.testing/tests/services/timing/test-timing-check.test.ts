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
