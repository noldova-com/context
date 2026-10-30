/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { nameof } from "@noldova/context.core";

import { TestWorkerRecord } from "./test-worker-record.js";

export class TestWorkerRun {
  public readonly classIndex: number;
  public readonly startMethodIndex: number;
  public readonly isStartMethodStopped: boolean;

  public constructor(classIndex: number, startMethodIndex: number, isStartMethodStopped: boolean) {
    this.classIndex = classIndex;
    this.startMethodIndex = startMethodIndex;
    this.isStartMethodStopped = isStartMethodStopped;
  }

  public static from(value: unknown): TestWorkerRun {
    const record = TestWorkerRecord.from(value);
    return new TestWorkerRun(
      record.count(nameof<TestWorkerRun>(t => t.classIndex)),
      record.count(nameof<TestWorkerRun>(t => t.startMethodIndex)),
      record.boolean(nameof<TestWorkerRun>(t => t.isStartMethodStopped)));
  }

  public toData(): object {
    return {
      classIndex: this.classIndex,
      startMethodIndex: this.startMethodIndex,
      isStartMethodStopped: this.isStartMethodStopped,
    };
  }
}
