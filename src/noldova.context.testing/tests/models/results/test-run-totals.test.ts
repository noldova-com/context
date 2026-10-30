/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestData, TestMethod, TestRunTotals } from "@noldova/context.testing";

@TestClass
export class TestRunTotalsTests {
  @TestMethod
  public derivesTheExecutedAndTotalCounts(): void {
    const totals = new TestRunTotals(3, 2, 1, 12.5);

    Assert.areEqual(3, totals.passed);
    Assert.areEqual(2, totals.failed);
    Assert.areEqual(1, totals.skipped);
    Assert.areEqual(12.5, totals.durationMilliseconds);
    Assert.areEqual(5, totals.executed);
    Assert.areEqual(6, totals.total);
  }

  @TestData(-1, 0, 0, 0)
  @TestData(0, 1.5, 0, 0)
  @TestData(0, 0, Number.NaN, 0)
  @TestData(0, 0, 0, -1)
  @TestData(0, 0, 0, Number.POSITIVE_INFINITY)
  @TestMethod
  public rejectsACountOrDurationOutOfRange(passed: number, failed: number, skipped: number, durationMilliseconds: number): void {
    Assert.throws(() => new TestRunTotals(passed, failed, skipped, durationMilliseconds), ArgumentOutOfRangeException);
  }
}
