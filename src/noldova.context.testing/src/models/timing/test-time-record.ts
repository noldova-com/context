/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { TestOutcome } from "../../enums/test-outcome.js";
import { TestingException } from "../../exceptions/testing.exception.js";
import { Resources } from "../../resources.js";
import type { TestRunResult } from "../results/test-run-result.js";

export class TestTimeRecord {
  public readonly packageName: string;
  public readonly filePath: string;
  public readonly className: string;
  public readonly methodName: string;
  public readonly testDataIndex: number | undefined;
  public readonly outcome: TestOutcome;
  public readonly durationMilliseconds: number;

  public constructor(packageName: string, filePath: string, className: string, methodName: string, testDataIndex: number | undefined,
    outcome: TestOutcome, durationMilliseconds: number) {
    this.packageName = packageName;
    this.filePath = filePath;
    this.className = className;
    this.methodName = methodName;
    this.testDataIndex = testDataIndex;
    this.outcome = outcome;
    this.durationMilliseconds = durationMilliseconds;
  }

  public get file(): string {
    return `${this.packageName}/${this.filePath}`;
  }

  public get test(): string {
    const row = Object.isUndefined(this.testDataIndex) ? String.empty : `[${this.testDataIndex}]`;
    return `${this.file} — ${this.className}.${this.methodName}${row}`;
  }

  public static fromResult(result: TestRunResult): TestTimeRecord[] {
    return result.classResults.flatMap(t => t.methodResults.map(u => new TestTimeRecord(
      u.packageName, t.filePath, u.className, u.methodName, u.testDataIndex, u.outcome, u.durationMilliseconds)));
  }

  public static parseAll(text: string): TestTimeRecord[] {
    let value: unknown;
    try {
      value = JSON.parse(text);
    }
    catch {
      throw new TestingException(Resources.testTimesInvalid);
    }

    if (!Array.isArray(value))
      throw new TestingException(Resources.testTimesInvalid);

    return value.map((t: unknown) => TestTimeRecord.parse(t));
  }

  public static slowest(records: readonly TestTimeRecord[], count: number): TestTimeRecord[] {
    return [...records].sort((left, right) => right.durationMilliseconds - left.durationMilliseconds).slice(0, count);
  }

  public static formatSlowest(records: readonly TestTimeRecord[], count: number): string[] {
    const slowest = TestTimeRecord.slowest(records, count);
    return slowest.length === 0 ? [] : [Resources.slowestTestsHeading, ...slowest.map(t => Resources.slowestTest(t.durationMilliseconds, t.test))];
  }

  public static formatAll(records: readonly TestTimeRecord[]): string {
    return JSON.stringify(records.map(t => ({
      packageName: t.packageName,
      filePath: t.filePath,
      className: t.className,
      methodName: t.methodName,
      testDataIndex: t.testDataIndex,
      outcome: t.outcome,
      durationMilliseconds: t.durationMilliseconds
    })));
  }

  private static parse(value: unknown): TestTimeRecord {
    const fields: unknown[] = Resources.testTimeFields.map(t => Object.isObject(value) ? Reflect.get(value, t) : undefined);
    const [packageName, filePath, className, methodName, testDataIndex, outcomeName, durationMilliseconds] = fields;
    const outcome = Object.values(TestOutcome).find(t => t === outcomeName);
    if (!Object.isString(packageName) || !Object.isString(filePath) || !Object.isString(className) || !Object.isString(methodName)
      || !(Object.isUndefined(testDataIndex) || Object.isNumber(testDataIndex) && Number.isInteger(testDataIndex) && testDataIndex >= 0)
      || Object.isUndefined(outcome)
      || !Object.isNumber(durationMilliseconds) || !Number.isFinite(durationMilliseconds) || durationMilliseconds < 0)
      throw new TestingException(Resources.testTimesInvalid);

    return new TestTimeRecord(packageName, filePath, className, methodName, testDataIndex, outcome, durationMilliseconds);
  }
}
