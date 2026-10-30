/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { TestOutcome } from "../../enums/test-outcome.js";
import { AssertFailedException } from "../../exceptions/assert-failed.exception.js";
import type { TestClassResult } from "../../models/results/test-class-result.js";
import type { TestMethodResult } from "../../models/results/test-method-result.js";
import type { TestRunResult } from "../../models/results/test-run-result.js";
import type { TestRunTotals } from "../../models/results/test-run-totals.js";
import type { TestSelection } from "../../models/results/test-selection.js";
import { Resources } from "../../resources.js";

export class TestReportWriter {
  private static readonly LABEL_WIDTH: number = 12;

  public formatLines(result: TestRunResult, skipPassingDetails: boolean): string[] {
    const lines: string[] = [];
    for (const classResult of result.classResults)
      lines.push(...this.formatClassLines(classResult, skipPassingDetails));

    lines.push(...this.formatSummaryLines(result, result.selection));
    return lines;
  }

  public formatClassLines(classResult: TestClassResult, skipPassingDetails: boolean): string[] {
    return this.formatClassBlock(
      this.formatClassHeading(classResult),
      classResult.methodResults.flatMap(t => this.formatMethodLines(t, skipPassingDetails)),
      skipPassingDetails);
  }

  public formatClassHeading(classResult: TestClassResult): string {
    return `${classResult.packageName}/${classResult.filePath} — ${classResult.className}`;
  }

  public formatMethodLines(methodResult: TestMethodResult, skipPassingDetails: boolean): string[] {
    if (skipPassingDetails && methodResult.outcome === TestOutcome.Passed)
      return [];

    const duration = `${Math.round(methodResult.durationMilliseconds)} ${Resources.millisecondUnit}`;
    const methodName = this.formatMethodName(methodResult);

    if (methodResult.outcome === TestOutcome.Passed)
      return [`  ${Resources.terminalGreen}${Resources.passedMark}${Resources.terminalReset} ${methodName} (${duration})`];

    if (methodResult.outcome === TestOutcome.Skipped)
      return [`  ${Resources.terminalYellow}${Resources.skippedMark}${Resources.terminalReset} ${Resources.skippedTest(methodName, methodResult.skipReason)}`];

    const lines = [`  ${Resources.terminalRed}${Resources.failedMark}${Resources.terminalReset} ${methodName} (${duration})`];
    lines.push(...this.formatFailureLines(methodResult.failure));
    return lines;
  }

  public formatClassBlock(heading: string, methodLines: readonly string[], skipPassingDetails: boolean): string[] {
    if (skipPassingDetails && methodLines.length === 0)
      return [];

    return [heading, ...methodLines, String.empty];
  }

  public formatSummaryLines(totals: TestRunTotals, selection?: TestSelection): string[] {
    const lines = [Resources.testReportSeparator];
    if (selection?.isFiltered === true)
      lines.push(
        this.formatRow(Resources.filtersLabel, selection.filters.map(t => JSON.stringify(t)).join(", ")),
        this.formatRow(Resources.discoveredLabel, selection.discovered),
        this.formatRow(Resources.selectedLabel, selection.selected),
        this.formatRow(Resources.unselectedLabel, selection.unselected));

    lines.push(
      this.formatRow(Resources.totalLabel, totals.total),
      this.formatRow(Resources.timeLabel, this.formatDuration(totals.durationMilliseconds)),
      `${Resources.terminalGreen}${this.formatRow(Resources.passedLabel, totals.passed)}${Resources.terminalReset}`);
    if (totals.failed > 0)
      lines.push(`${Resources.terminalRed}${this.formatRow(Resources.failedLabel, totals.failed)}${Resources.terminalReset}`);
    if (totals.skipped > 0)
      lines.push(`${Resources.terminalYellow}${this.formatRow(Resources.skippedLabel, totals.skipped)}${Resources.terminalReset}`);

    return lines;
  }

  private formatRow(label: string, value: string | number): string {
    return `${label.padEnd(TestReportWriter.LABEL_WIDTH)}${value}`;
  }

  private formatDuration(durationMilliseconds: number): string {
    const roundedMilliseconds = Math.round(durationMilliseconds);
    if (roundedMilliseconds < Resources.millisecondsPerSecond)
      return `${roundedMilliseconds} ${Resources.millisecondUnit}`;

    const totalCentiseconds = Math.round(roundedMilliseconds / Resources.millisecondsPerCentisecond);
    const centisecondsPerMinute = Resources.centisecondsPerSecond * Resources.secondsPerMinute;
    if (totalCentiseconds < centisecondsPerMinute)
      return `${(totalCentiseconds / Resources.centisecondsPerSecond).toFixed(Resources.durationDecimalPlaces)} ${Resources.secondUnit}`;

    const totalMinutes = Math.floor(totalCentiseconds / centisecondsPerMinute);
    const seconds = totalCentiseconds % centisecondsPerMinute / Resources.centisecondsPerSecond;
    if (totalMinutes < Resources.minutesPerHour)
      return `${totalMinutes} ${Resources.minuteUnit} ${seconds.toFixed(Resources.durationDecimalPlaces)} ${Resources.secondUnit}`;

    const hours = Math.floor(totalMinutes / Resources.minutesPerHour);
    const minutes = totalMinutes % Resources.minutesPerHour;
    return `${hours} ${Resources.hourUnit} ${minutes} ${Resources.minuteUnit} ${seconds.toFixed(Resources.durationDecimalPlaces)} ${Resources.secondUnit}`;
  }

  private formatMethodName(methodResult: TestMethodResult): string {
    if (Object.isUndefined(methodResult.testDataIndex))
      return methodResult.methodName;

    return `${methodResult.methodName}[${methodResult.testDataIndex}](${methodResult.testData.map(t => this.formatValue(t)).join(Resources.valueSeparator)})`;
  }

  private formatFailureLines(failure: unknown): string[] {
    try {
      if (failure instanceof AssertFailedException) {
        const lines = [`${Resources.reportIndent.repeat(2)}${this.formatValue(failure)}`];
        if (!Object.isUndefined(failure.expected) || !Object.isUndefined(failure.actual)) {
          lines.push(`${Resources.reportIndent.repeat(2)}${Resources.expectedLabel} ${this.formatValue(failure.expected)}`);
          lines.push(`${Resources.reportIndent.repeat(2)}${Resources.actualLabel}   ${this.formatValue(failure.actual)}`);
        }

        return lines;
      }

      if (failure instanceof Error)
        return [`${Resources.reportIndent.repeat(2)}${this.formatValue(failure)}`];

      return [`${Resources.reportIndent.repeat(2)}${Resources.threwLabel} ${this.formatValue(failure)}`];
    }
    catch {
      return [`${Resources.reportIndent.repeat(2)}${Resources.threwLabel} ${Resources.unprintableValue}`];
    }
  }

  private formatValue(value: unknown): string {
    try {
      if (Object.isString(value))
        return JSON.stringify(value);

      if (value instanceof Error)
        return `${value.name}: ${value.message}`;

      return String(value);
    }
    catch {
      return Resources.unprintableValue;
    }
  }
}
