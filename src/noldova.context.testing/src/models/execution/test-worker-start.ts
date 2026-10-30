/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { nameof } from "@noldova/context.core";

import { TestProject } from "../discovery/test-project.js";
import { TestWorkerRecord } from "./test-worker-record.js";

export class TestWorkerStart {
  public readonly testProjects: readonly TestProject[];
  public readonly filters: readonly string[];
  public readonly timeoutMilliseconds: number;

  public constructor(testProjects: readonly TestProject[], filters: readonly string[], timeoutMilliseconds: number) {
    this.testProjects = testProjects;
    this.filters = filters;
    this.timeoutMilliseconds = timeoutMilliseconds;
  }

  public static from(value: unknown): TestWorkerStart {
    const record = TestWorkerRecord.from(value);
    return new TestWorkerStart(
      record.records(nameof<TestWorkerStart>(t => t.testProjects))
        .map(t => new TestProject(t.string(nameof<TestProject>(p => p.packageName)), t.string(nameof<TestProject>(p => p.rootDirectory)))),
      record.strings(nameof<TestWorkerStart>(t => t.filters)),
      record.count(nameof<TestWorkerStart>(t => t.timeoutMilliseconds)));
  }

  public toData(): object {
    return {
      testProjects: this.testProjects.map(t => ({ packageName: t.packageName, rootDirectory: t.rootDirectory })),
      filters: [...this.filters],
      timeoutMilliseconds: this.timeoutMilliseconds,
    };
  }
}
