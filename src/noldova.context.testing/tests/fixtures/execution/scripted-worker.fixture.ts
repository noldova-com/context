/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Worker } from "node:worker_threads";

import type { TestWorkerMessage } from "@noldova/context.testing/models/execution/test-worker-message.js";
import { TestWorkerRun } from "@noldova/context.testing/models/execution/test-worker-run.js";

import { FixtureTestProject } from "./fixture-test-project.fixture.js";

// Stands in for a test worker in the supervisor's tests: an idle thread whose messages come from the test, so the test sets their order.
// Each run the supervisor posts is kept in runs and calls the script on a later microtask, as a real worker answers later; terminate waits until
// the test releases it.
export class ScriptedWorker extends Worker {
  private readonly script: (worker: ScriptedWorker) => void;
  private readonly released: Promise<void>;
  private readonly signalTerminating: () => void;
  public readonly terminating: Promise<void>;
  public readonly runs: TestWorkerRun[];

  public constructor(script: (worker: ScriptedWorker) => void, released: Promise<void> = Promise.resolve()) {
    super(FixtureTestProject.workerUrl("silent-worker"));

    const terminating = Promise.withResolvers<void>();
    this.terminating = terminating.promise;
    this.script = script;
    this.released = released;
    this.signalTerminating = terminating.resolve;
    this.runs = [];
  }

  public send(message: TestWorkerMessage): void {
    this.emit("message", message.toData());
  }

  public override postMessage(value: unknown): void {
    this.runs.push(TestWorkerRun.from(value));
    queueMicrotask(() => this.script(this));
  }

  public override async terminate(): Promise<number> {
    this.signalTerminating();
    await this.released;
    return super.terminate();
  }
}
