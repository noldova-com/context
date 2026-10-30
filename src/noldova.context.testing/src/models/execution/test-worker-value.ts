/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { nameof } from "@noldova/context.core";

import { TestWorkerValueKind } from "../../enums/test-worker-value-kind.js";
import { AssertFailedException } from "../../exceptions/assert-failed.exception.js";
import { TestTimeoutException } from "../../exceptions/test-timeout.exception.js";
import { TestingException } from "../../exceptions/testing.exception.js";
import { Resources } from "../../resources.js";
import { TestWorkerRecord } from "./test-worker-record.js";
import { TestWorkerText } from "./test-worker-text.js";

export class TestWorkerValue {
  private static readonly KINDS: ReadonlySet<string> = new Set(Object.values(TestWorkerValueKind));

  public readonly kind: TestWorkerValueKind;
  public readonly value: unknown;
  public readonly name: string;
  public readonly message: string;
  public readonly stack: string | undefined;
  public readonly timeoutMilliseconds: number;
  public readonly details: readonly TestWorkerValue[];

  private constructor(kind: TestWorkerValueKind, value: unknown, name: string, message: string, stack: string | undefined, timeoutMilliseconds: number,
    details: readonly TestWorkerValue[]) {
    this.kind = kind;
    this.value = value;
    this.name = name;
    this.message = message;
    this.stack = stack;
    this.timeoutMilliseconds = timeoutMilliseconds;
    this.details = details;
  }

  public static of(value: unknown): TestWorkerValue {
    if (TestWorkerValue.isPlain(value))
      return new TestWorkerValue(TestWorkerValueKind.Value, value, String.empty, String.empty, undefined, 0, []);

    if (value instanceof TestTimeoutException)
      return TestWorkerValue.ofError(TestWorkerValueKind.Timeout, value, value.timeoutMilliseconds, []);

    if (value instanceof AssertFailedException)
      return TestWorkerValue.ofError(TestWorkerValueKind.Assert, value, 0, [TestWorkerValue.of(value.expected), TestWorkerValue.of(value.actual)]);

    if (value instanceof Error)
      return TestWorkerValue.ofError(TestWorkerValueKind.Error, value, 0, []);

    return new TestWorkerValue(TestWorkerValueKind.Text, undefined, String.empty, TestWorkerValue.print(value), undefined, 0, []);
  }

  public static from(value: unknown): TestWorkerValue {
    const record = TestWorkerRecord.from(value);
    const kind = record.string(nameof<TestWorkerValue>(t => t.kind));
    const plain = record.value(nameof<TestWorkerValue>(t => t.value));
    const details = record.values(nameof<TestWorkerValue>(t => t.details)).map(t => TestWorkerValue.from(t));
    if (!TestWorkerValue.isKind(kind) || !TestWorkerValue.isPlain(plain) || details.length !== (kind === TestWorkerValueKind.Assert ? 2 : 0))
      throw new TestingException(Resources.testWorkerDataInvalid);

    return new TestWorkerValue(
      kind,
      plain,
      record.string(nameof<TestWorkerValue>(t => t.name)),
      record.string(nameof<TestWorkerValue>(t => t.message)),
      record.optionalString(nameof<TestWorkerValue>(t => t.stack)),
      record.count(nameof<TestWorkerValue>(t => t.timeoutMilliseconds)),
      details);
  }

  public toData(): object {
    return {
      kind: this.kind,
      value: this.value,
      name: this.name,
      message: this.message,
      stack: this.stack,
      timeoutMilliseconds: this.timeoutMilliseconds,
      details: this.details.map(t => t.toData()),
    };
  }

  public toValue(): unknown {
    if (this.kind === TestWorkerValueKind.Value)
      return this.value;

    if (this.kind === TestWorkerValueKind.Text)
      return new TestWorkerText(this.message);

    const error = this.toError();
    error.name = this.name;
    if (!Object.isUndefined(this.stack))
      error.stack = this.stack;

    return error;
  }

  private static ofError(kind: TestWorkerValueKind, error: Error, timeoutMilliseconds: number, details: readonly TestWorkerValue[]): TestWorkerValue {
    const stack: unknown = error.stack;
    return new TestWorkerValue(kind, undefined, TestWorkerValue.print(error.name), TestWorkerValue.print(error.message),
      Object.isString(stack) ? stack : undefined, timeoutMilliseconds, details);
  }

  private static isPlain(value: unknown): boolean {
    return Object.isNullOrUndefined(value) || Object.isString(value) || Object.isNumber(value) || Object.isBoolean(value) || Object.isBigInt(value);
  }

  private static isKind(value: string): value is TestWorkerValueKind {
    return TestWorkerValue.KINDS.has(value);
  }

  private static print(value: unknown): string {
    try {
      return String(value);
    }
    catch {
      return Resources.unprintableValue;
    }
  }

  private toError(): Error {
    if (this.kind === TestWorkerValueKind.Timeout)
      return new TestTimeoutException(this.timeoutMilliseconds);

    if (this.kind === TestWorkerValueKind.Assert) {
      const [expected, actual] = this.details.map(t => t.toValue());
      return new AssertFailedException(this.message, expected, actual);
    }

    return new Error(this.message);
  }
}
