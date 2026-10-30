/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { nameof } from "@noldova/context.core";

import { TestWorkerMessageKind } from "../../enums/test-worker-message-kind.js";
import { TestingException } from "../../exceptions/testing.exception.js";
import { Resources } from "../../resources.js";
import { TestWorkerRecord } from "./test-worker-record.js";
import { TestWorkerResult } from "./test-worker-result.js";

export class TestWorkerMessage {
  private static readonly KINDS: ReadonlySet<string> = new Set(Object.values(TestWorkerMessageKind));

  public readonly kind: TestWorkerMessageKind;
  public readonly classIndex: number;
  public readonly methodIndex: number;
  public readonly filePath: string;
  public readonly result: TestWorkerResult | undefined;
  public readonly classCount: number;
  public readonly methodCount: number;
  public readonly discoveredCount: number;

  private constructor(kind: TestWorkerMessageKind, classIndex: number, methodIndex: number, filePath: string, result: TestWorkerResult | undefined,
    classCount: number, methodCount: number, discoveredCount: number) {
    this.kind = kind;
    this.classIndex = classIndex;
    this.methodIndex = methodIndex;
    this.filePath = filePath;
    this.result = result;
    this.classCount = classCount;
    this.methodCount = methodCount;
    this.discoveredCount = discoveredCount;
  }

  public static imported(filePath: string): TestWorkerMessage {
    return new TestWorkerMessage(TestWorkerMessageKind.Imported, 0, 0, filePath, undefined, 0, 0, 0);
  }

  public static ready(classCount: number, methodCount: number, discoveredCount: number): TestWorkerMessage {
    return new TestWorkerMessage(TestWorkerMessageKind.Ready, 0, 0, String.empty, undefined, classCount, methodCount, discoveredCount);
  }

  public static started(classIndex: number, methodIndex: number): TestWorkerMessage {
    return new TestWorkerMessage(TestWorkerMessageKind.Started, classIndex, methodIndex, String.empty, undefined, 0, 0, 0);
  }

  public static methodCompleted(classIndex: number, methodIndex: number, result: TestWorkerResult): TestWorkerMessage {
    return new TestWorkerMessage(TestWorkerMessageKind.MethodCompleted, classIndex, methodIndex, String.empty, result, 0, 0, 0);
  }

  public static timedOut(classIndex: number, methodIndex: number, filePath: string): TestWorkerMessage {
    return new TestWorkerMessage(TestWorkerMessageKind.TimedOut, classIndex, methodIndex, filePath, undefined, 0, 0, 0);
  }

  public static classCompleted(classIndex: number, filePath: string): TestWorkerMessage {
    return new TestWorkerMessage(TestWorkerMessageKind.ClassCompleted, classIndex, 0, filePath, undefined, 0, 0, 0);
  }

  public static from(value: unknown): TestWorkerMessage {
    const record = TestWorkerRecord.from(value);
    const kind = record.string(nameof<TestWorkerMessage>(t => t.kind));
    if (!TestWorkerMessage.isKind(kind))
      throw new TestingException(Resources.testWorkerDataInvalid);

    const result = record.value(nameof<TestWorkerMessage>(t => t.result));
    return new TestWorkerMessage(
      kind,
      record.count(nameof<TestWorkerMessage>(t => t.classIndex)),
      record.count(nameof<TestWorkerMessage>(t => t.methodIndex)),
      record.string(nameof<TestWorkerMessage>(t => t.filePath)),
      Object.isUndefined(result) ? result : TestWorkerResult.from(result),
      record.count(nameof<TestWorkerMessage>(t => t.classCount)),
      record.count(nameof<TestWorkerMessage>(t => t.methodCount)),
      record.count(nameof<TestWorkerMessage>(t => t.discoveredCount)));
  }

  public toData(): object {
    return {
      kind: this.kind,
      classIndex: this.classIndex,
      methodIndex: this.methodIndex,
      filePath: this.filePath,
      result: this.result?.toData(),
      classCount: this.classCount,
      methodCount: this.methodCount,
      discoveredCount: this.discoveredCount,
    };
  }

  private static isKind(value: string): value is TestWorkerMessageKind {
    return TestWorkerMessage.KINDS.has(value);
  }
}
