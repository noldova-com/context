/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { once } from "node:events";
import { BroadcastChannel, Worker } from "node:worker_threads";

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { TestWorkerMessageKind } from "@noldova/context.testing/enums/test-worker-message-kind.js";
import { TestWorkerMessage } from "@noldova/context.testing/models/execution/test-worker-message.js";
import { TestWorkerRun } from "@noldova/context.testing/models/execution/test-worker-run.js";
import { TestWorkerStart } from "@noldova/context.testing/models/execution/test-worker-start.js";

import { FixtureTestProject } from "../../fixtures/execution/fixture-test-project.fixture.js";
import { LateRejectionFixtureTests } from "../../fixtures/execution/late-rejection-fixture.fixture.js";

@TestClass
export class TestRunWorkerEntryPointTests {
  private static readonly ENTRY_POINT: string = "@noldova/context.testing/services/execution/test-run-worker-entry-point.js";

  @TestMethod
  public async runsTheClassesItsSupervisorNamesAsync(): Promise<void> {
    const project = await FixtureTestProject.createAsync(["passing-fixture"]);
    const worker = new Worker(new URL(import.meta.resolve(TestRunWorkerEntryPointTests.ENTRY_POINT)),
      { workerData: new TestWorkerStart([project.testProject], [], 1000).toData() });
    try {
      const kinds: string[] = [];
      await new Promise<void>(resolve => worker.on("message", (value: unknown) => {
        const message = TestWorkerMessage.from(value);
        kinds.push(message.kind);
        if (message.kind === TestWorkerMessageKind.Ready)
          worker.postMessage(new TestWorkerRun(0, 0, false).toData());
        else if (message.kind === TestWorkerMessageKind.ClassCompleted)
          resolve();
      }));

      Assert.areEqual("Imported,Ready,Started,MethodCompleted,ClassCompleted", kinds.join());
    }
    finally {
      await TestRunWorkerEntryPointTests.endAsync(worker);
      await project.removeAsync();
    }
  }

  @TestMethod
  public async endsItsThreadByItselfWhenNoRunIsLeftAsync(): Promise<void> {
    const project = await FixtureTestProject.createAsync(["passing-fixture"]);
    const worker = new Worker(new URL(import.meta.resolve(TestRunWorkerEntryPointTests.ENTRY_POINT)),
      { workerData: new TestWorkerStart([project.testProject], [], 1000).toData() });
    try {
      await new Promise<void>(resolve => worker.on("message", (value: unknown) => {
        if (TestWorkerMessage.from(value).kind === TestWorkerMessageKind.Ready)
          resolve();
      }));

      const exitCode = await TestRunWorkerEntryPointTests.endAsync(worker);

      Assert.areEqual(0, exitCode);
    }
    finally {
      await worker.terminate();
      await project.removeAsync();
    }
  }

  @TestMethod
  public async outlivesARejectionFromATestThatTimedOutAsync(): Promise<void> {
    const project = await FixtureTestProject.createAsync(["late-rejection-fixture"]);
    const worker = new Worker(new URL(import.meta.resolve(TestRunWorkerEntryPointTests.ENTRY_POINT)),
      { workerData: new TestWorkerStart([project.testProject], [], 1).toData() });
    try {
      const events: string[] = [];
      await new Promise<void>(resolve => {
        worker.on("message", (value: unknown) => {
          events.push(Object.isString(value) ? value : TestWorkerMessage.from(value).kind);
          if (events.length === 1)
            worker.postMessage(new TestWorkerRun(0, 0, false).toData());
          else if (events.at(-1) === TestWorkerMessageKind.TimedOut) {
            const channel = new BroadcastChannel(LateRejectionFixtureTests.CHANNEL_NAME);
            channel.postMessage("reject");
            channel.close();
          }
          else if (value === "rejectedLate")
            resolve();
        });
        worker.on("error", (error: Error) => {
          events.push(error.message);
          resolve();
        });
      });

      Assert.areEqual("Imported,Ready,Started,MethodCompleted,TimedOut,rejectedLate", events.join());
    }
    finally {
      await TestRunWorkerEntryPointTests.endAsync(worker);
      await project.removeAsync();
    }
  }

  // Tells the worker no run is left and waits until its thread ends by itself, so the thread writes its coverage.
  private static async endAsync(worker: Worker): Promise<number> {
    if (worker.threadId === -1)
      return worker.terminate();

    const exited = once(worker, "exit");
    worker.postMessage(undefined);
    const [exitCode] = await exited;
    return exitCode as number;
  }
}
