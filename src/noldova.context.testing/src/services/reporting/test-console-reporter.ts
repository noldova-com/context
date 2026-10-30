/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IClock } from "../../interfaces/i-clock.js";
import type { ITestProgressListener } from "../../interfaces/i-test-progress-listener.js";
import type { TestClassResult } from "../../models/results/test-class-result.js";
import type { TestRunTotals } from "../../models/results/test-run-totals.js";
import type { TestSelection } from "../../models/results/test-selection.js";
import { Resources } from "../../resources.js";
import { SystemClock } from "../timing/system-clock.js";
import { TestReportWriter } from "./test-report-writer.js";

export class TestConsoleReporter implements ITestProgressListener {
  private readonly write: (text: string) => void;
  private readonly isInteractive: boolean;
  private readonly skipPassingDetails: boolean;
  private readonly clock: IClock;
  private readonly reportWriter: TestReportWriter;
  private progressTimer: number | undefined;
  private progressFrame: number;

  public constructor(write: (text: string) => void, isInteractive: boolean, skipPassingDetails: boolean, clock: IClock = new SystemClock(false)) {
    this.write = write;
    this.isInteractive = isInteractive;
    this.skipPassingDetails = skipPassingDetails;
    this.clock = clock;
    this.reportWriter = new TestReportWriter();
    this.progressFrame = 0;
  }

  public start(): void {
    if (!this.isInteractive)
      return;

    this.drawProgress();
    this.scheduleProgress();
  }

  public onClassCompleted(classResult: TestClassResult): void {
    this.writeClassLines(this.reportWriter.formatClassLines(classResult, this.skipPassingDetails));
  }

  public writeClassLines(lines: readonly string[]): void {
    if (lines.length === 0)
      return;

    const isShowingProgress = !Object.isUndefined(this.progressTimer);
    if (isShowingProgress)
      this.write(Resources.terminalClearLine);
    this.writeLines(lines);
    if (isShowingProgress)
      this.drawProgress();
  }

  public stop(): void {
    if (Object.isUndefined(this.progressTimer))
      return;

    this.clock.clearTimeout(this.progressTimer);
    this.progressTimer = undefined;
    this.write(Resources.terminalClearLine);
  }

  public writeSummary(totals: TestRunTotals, selection?: TestSelection): void {
    this.stop();
    this.writeLines(this.reportWriter.formatSummaryLines(totals, selection));
  }

  private scheduleProgress(): void {
    this.progressTimer = this.clock.setTimeout(() => this.advanceProgress(), Resources.progressIntervalMilliseconds);
  }

  private advanceProgress(): void {
    this.progressFrame = (this.progressFrame + 1) % Resources.progressFrames.length;
    this.drawProgress();
    this.scheduleProgress();
  }

  private drawProgress(): void {
    this.write(`${Resources.terminalClearLine}${Resources.progressFrames[this.progressFrame]!}`);
  }

  private writeLines(lines: readonly string[]): void {
    this.write(`${lines.join(Resources.lineFeed)}${Resources.lineFeed}`);
  }
}
