/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { parentPort, workerData } from "node:worker_threads";

import { TestWorkerStart } from "../../models/execution/test-worker-start.js";
import { TestRunWorker } from "./test-run-worker.js";

export class TestRunWorkerEntryPoint {
  public async runAsync(): Promise<void> {
    await new TestRunWorker(parentPort!, TestWorkerStart.from(workerData)).startAsync();
  }
}

await new TestRunWorkerEntryPoint().runAsync();
