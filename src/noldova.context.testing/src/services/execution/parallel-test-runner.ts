/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IClock } from "../../interfaces/i-clock.js";
import type { ITestProgressListener } from "../../interfaces/i-test-progress-listener.js";
import type { TestProject } from "../../models/discovery/test-project.js";
import type { TestRunResult } from "../../models/results/test-run-result.js";
import { SystemClock } from "../timing/system-clock.js";
import { TestRunSupervisor } from "./test-run-supervisor.js";

export class ParallelTestRunner {
  private readonly timeoutMilliseconds: number;
  private readonly workerCount: number;
  private readonly clock: IClock;

  public constructor(timeoutMilliseconds: number, workerCount: number = TestRunSupervisor.defaultWorkerCount(), clock: IClock = new SystemClock()) {
    TestRunSupervisor.throwIfLimitsInvalid(timeoutMilliseconds, workerCount);

    this.timeoutMilliseconds = timeoutMilliseconds;
    this.workerCount = workerCount;
    this.clock = clock;
  }

  public runAsync(testProjects: readonly TestProject[], filters: readonly string[] = [], progressListener?: ITestProgressListener): Promise<TestRunResult> {
    return new TestRunSupervisor(this.timeoutMilliseconds, testProjects, filters, progressListener, undefined, this.workerCount, undefined, undefined,
      this.clock).runAsync();
  }
}
