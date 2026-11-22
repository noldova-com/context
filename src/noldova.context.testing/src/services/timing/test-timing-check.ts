/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";

import { TestFileTiming } from "../../models/timing/test-file-timing.js";
import type { TestTimeRecord } from "../../models/timing/test-time-record.js";
import { Resources } from "../../resources.js";

export class TestTimingCheck {
  private readonly budgetMilliseconds: number;
  private readonly margin: number;
  private readonly listed: ReadonlyMap<string, number>;

  public constructor(budgetMilliseconds: number, margin: number, listed: ReadonlyMap<string, number>) {
    if (!Number.isFinite(budgetMilliseconds) || budgetMilliseconds <= 0)
      throw new ArgumentOutOfRangeException(Resources.budgetMillisecondsParameter, budgetMilliseconds, Resources.budgetInvalid);
    if (!Number.isFinite(margin) || margin < 0)
      throw new ArgumentOutOfRangeException(Resources.marginParameter, margin, Resources.marginInvalid);

    this.budgetMilliseconds = budgetMilliseconds;
    this.margin = margin;
    this.listed = listed;
  }

  public static median(values: readonly number[]): number | undefined {
    const sorted = [...values].sort((left, right) => left - right);
    const middle = Math.floor(sorted.length / 2);
    const upper = sorted[middle];
    const lower = sorted.length % 2 === 0 ? sorted[middle - 1] : upper;
    return Object.isUndefined(upper) || Object.isUndefined(lower) ? undefined : (lower + upper) / 2;
  }

  public judge(runs: readonly (readonly TestTimeRecord[])[]): TestFileTiming[] {
    const times = new Map<string, number[]>();
    for (const run of runs) {
      const sums = new Map<string, number>();
      for (const record of run)
        sums.set(record.file, (sums.get(record.file) ?? 0) + record.durationMilliseconds);
      for (const [file, sum] of sums)
        times.set(file, [...times.get(file) ?? [], sum]);
    }

    const files = [...new Set([...times.keys(), ...this.listed.keys()])].sort();
    const budgetLimit = this.budgetMilliseconds * (1 + this.margin);
    return files.map(t => {
      const allowed = this.listed.get(t);
      const limit = Object.isUndefined(allowed) ? budgetLimit : allowed * (1 + this.margin);
      return new TestFileTiming(t, TestTimingCheck.median(times.get(t) ?? []), limit, budgetLimit, !Object.isUndefined(allowed));
    });
  }

  public static readListed(markdown: string): Map<string, number> {
    const lines = markdown.split(Resources.lineEndPattern);
    const listed = new Map<string, number>();
    const start = lines.indexOf(Resources.slowerFilesHeading);
    if (start === -1)
      return listed;

    for (const line of lines.slice(start + 1)) {
      if (!line.startsWith(Resources.tableRowPrefix)) {
        if (line === String.empty)
          continue;

        break;
      }

      const match = Resources.slowerFileRowPattern.exec(line);
      const file = match?.[1];
      const milliseconds = match?.[2];
      if (!Object.isUndefined(file) && !Object.isUndefined(milliseconds))
        listed.set(file, Number(milliseconds));
    }

    return listed;
  }

  public static formatSummary(timings: readonly TestFileTiming[], runs: number): string {
    return Resources.timingSummary(timings.length, runs, timings.filter(t => t.isOver).length, timings.filter(t => t.isStale).length);
  }
}
