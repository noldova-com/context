/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { nameof } from "@noldova/context.core";

import { TestOutcome } from "../../enums/test-outcome.js";
import { TestingException } from "../../exceptions/testing.exception.js";
import { Resources } from "../../resources.js";
import { TestMethodResult } from "../results/test-method-result.js";
import { TestWorkerRecord } from "./test-worker-record.js";
import { TestWorkerValue } from "./test-worker-value.js";

export class TestWorkerResult {
  private static readonly OUTCOMES: ReadonlySet<string> = new Set(Object.values(TestOutcome));

  public readonly methodResult: TestMethodResult;

  public constructor(methodResult: TestMethodResult) {
    this.methodResult = methodResult;
  }

  public static from(value: unknown): TestWorkerResult {
    const record = TestWorkerRecord.from(value);
    const outcome = record.string(nameof<TestMethodResult>(t => t.outcome));
    if (!TestWorkerResult.isOutcome(outcome))
      throw new TestingException(Resources.testWorkerDataInvalid);

    return new TestWorkerResult(new TestMethodResult(
      record.string(nameof<TestMethodResult>(t => t.packageName)),
      record.string(nameof<TestMethodResult>(t => t.className)),
      record.string(nameof<TestMethodResult>(t => t.methodName)),
      record.optionalCount(nameof<TestMethodResult>(t => t.testDataIndex)),
      record.values(nameof<TestMethodResult>(t => t.testData)).map(t => TestWorkerValue.from(t).toValue()),
      outcome,
      record.duration(nameof<TestMethodResult>(t => t.durationMilliseconds)),
      TestWorkerValue.from(record.value(nameof<TestMethodResult>(t => t.failure))).toValue(),
      record.optionalString(nameof<TestMethodResult>(t => t.skipReason))));
  }

  public toData(): object {
    return {
      packageName: this.methodResult.packageName,
      className: this.methodResult.className,
      methodName: this.methodResult.methodName,
      testDataIndex: this.methodResult.testDataIndex,
      testData: this.methodResult.testData.map(t => TestWorkerValue.of(t).toData()),
      outcome: this.methodResult.outcome,
      durationMilliseconds: this.methodResult.durationMilliseconds,
      failure: TestWorkerValue.of(this.methodResult.failure).toData(),
      skipReason: this.methodResult.skipReason,
    };
  }

  private static isOutcome(value: string): value is TestOutcome {
    return TestWorkerResult.OUTCOMES.has(value);
  }
}
