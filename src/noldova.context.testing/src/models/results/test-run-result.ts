/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TestOutcome } from "../../enums/test-outcome.js";
import type { TestClassResult } from "./test-class-result.js";
import { TestRunTotals } from "./test-run-totals.js";
import { TestSelection } from "./test-selection.js";

export class TestRunResult extends TestRunTotals {
  public readonly classResults: readonly TestClassResult[];
  public readonly selection: TestSelection;

  public constructor(classResults: readonly TestClassResult[], selection?: TestSelection) {
    let durationMilliseconds = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    for (const classResult of classResults)
      for (const methodResult of classResult.methodResults) {
        durationMilliseconds += methodResult.durationMilliseconds;
        if (methodResult.outcome === TestOutcome.Passed)
          passed++;
        else if (methodResult.outcome === TestOutcome.Failed)
          failed++;
        else
          skipped++;
      }

    super(passed, failed, skipped, durationMilliseconds);
    this.classResults = [...classResults];
    this.selection = selection ?? new TestSelection([], this.total, this.total);
  }
}
