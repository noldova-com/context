/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { nameof } from "@noldova/context.core";
import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";

import { Resources } from "../../resources.js";

export class TestRunTotals {
  public readonly durationMilliseconds: number;
  public readonly passed: number;
  public readonly failed: number;
  public readonly skipped: number;
  public readonly executed: number;
  public readonly total: number;

  public constructor(passed: number, failed: number, skipped: number, durationMilliseconds: number) {
    TestRunTotals.throwIfNotCount(passed, nameof<TestRunTotals>(t => t.passed));
    TestRunTotals.throwIfNotCount(failed, nameof<TestRunTotals>(t => t.failed));
    TestRunTotals.throwIfNotCount(skipped, nameof<TestRunTotals>(t => t.skipped));
    if (!Number.isFinite(durationMilliseconds) || durationMilliseconds < 0)
      throw new ArgumentOutOfRangeException(nameof<TestRunTotals>(t => t.durationMilliseconds), durationMilliseconds, Resources.durationInvalid);

    this.durationMilliseconds = durationMilliseconds;
    this.passed = passed;
    this.failed = failed;
    this.skipped = skipped;
    this.executed = passed + failed;
    this.total = this.executed + skipped;
  }

  private static throwIfNotCount(count: number, parameterName: string): void {
    if (!Number.isInteger(count) || count < 0)
      throw new ArgumentOutOfRangeException(parameterName, count, Resources.testCountInvalid);
  }
}
