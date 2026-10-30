/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { once } from "node:events";
import { MessageChannel, type MessagePort } from "node:worker_threads";

import { Assert, type IClock, TestClass, TestingException, TestMethod, TestOutcome, TestTimeoutException } from "@noldova/context.testing";
import { TestWorkerMessageKind } from "@noldova/context.testing/enums/test-worker-message-kind.js";
import { TestWorkerMessage } from "@noldova/context.testing/models/execution/test-worker-message.js";
import { TestWorkerRun } from "@noldova/context.testing/models/execution/test-worker-run.js";
import { TestWorkerStart } from "@noldova/context.testing/models/execution/test-worker-start.js";
import { TestRunWorker } from "@noldova/context.testing/services/execution/test-run-worker.js";

import { FakeClock } from "../../fixtures/execution/fake-clock.fixture.js";
import { FixtureTestProject } from "../../fixtures/execution/fixture-test-project.fixture.js";
import { LeakingTimerFixtureTests } from "../../fixtures/execution/leaking-timer-fixture.fixture.js";

@TestClass
export class TestRunWorkerTests {
  @TestMethod
  public async announcesTheSelectedClassesAndMethodsOnceReadyAsync(): Promise<void> {
    const messages = await this.runAsync(["hanging-fixture", "passing-fixture"], async () => { }, [TestWorkerMessageKind.Ready]);

    Assert.areEqual("Imported hanging-fixture.test.js,Imported passing-fixture.test.js,Ready 2.3",
      messages.map(t => TestRunWorkerTests.describe(t)).join());
    Assert.areEqual(3, messages[2]!.discoveredCount);
  }

  @TestMethod
  public async announcesWhatItsFiltersSelectedOutOfWhatItDiscoveredAsync(): Promise<void> {
    const messages = await this.runAsync(["hanging-fixture", "passing-fixture"], async () => { }, [TestWorkerMessageKind.Ready], ["Passing"]);

    Assert.areEqual("Imported hanging-fixture.test.js,Imported passing-fixture.test.js,Ready 1.1",
      messages.map(t => TestRunWorkerTests.describe(t)).join());
    Assert.areEqual(3, messages[2]!.discoveredCount);
  }

  @TestMethod
  public async stopsAfterReportingATimeoutAsync(): Promise<void> {
    const listeners = process.listeners("unhandledRejection");
    const messages = await this.runAsync(["hanging-fixture"], t => t.runAsync(new TestWorkerRun(0, 0, false)), undefined, undefined, new FakeClock(true));

    Assert.areEqual("Imported hanging-fixture.test.js,Ready 1.2,Started 0.0,MethodCompleted 0.0,TimedOut 0.0",
      messages.map(t => TestRunWorkerTests.describe(t)).join());
    Assert.areEqual(TestOutcome.Failed, messages[3]!.result?.methodResult.outcome);
    Assert.isInstanceOf(messages[3]!.result?.methodResult.failure, TestTimeoutException);
    Assert.areEqual("", messages[4]!.filePath);
    Assert.areEqual(listeners.length, process.listenerCount("unhandledRejection"));
  }

  @TestMethod
  public async completesTheClassWhoseLastTestTimesOutAndStopsAsync(): Promise<void> {
    const listeners = process.listeners("unhandledRejection");
    const messages = await this.runAsync(["hanging-last-fixture", "passing-fixture"], t => t.runAsync(new TestWorkerRun(0, 0, false)), undefined, undefined,
      new FakeClock(true));

    Assert.areEqual("Imported hanging-last-fixture.test.js,Imported passing-fixture.test.js," +
      "Ready 2.3,Started 0.0,MethodCompleted 0.0,Started 0.1,MethodCompleted 0.1,TimedOut 0.1",
      messages.map(t => TestRunWorkerTests.describe(t)).join());
    Assert.areEqual("hanging-last-fixture.test.js", messages[7]!.filePath);
    Assert.areEqual(listeners.length, process.listenerCount("unhandledRejection"));
  }

  @TestMethod
  public async resumesAfterTheTestThatTimedOutAsync(): Promise<void> {
    const messages = await this.runAsync(["hanging-fixture"], t => t.runAsync(new TestWorkerRun(0, 1, false)));

    Assert.areEqual("Imported hanging-fixture.test.js,Ready 1.2,Started 0.1,MethodCompleted 0.1,ClassCompleted 0",
      messages.map(t => TestRunWorkerTests.describe(t)).join());
    Assert.areEqual(TestOutcome.Passed, messages[3]!.result?.methodResult.outcome);
    Assert.areEqual("hanging-fixture.test.js", messages[4]!.filePath);
  }

  @TestMethod
  public async recordsAStoppedTestWithoutAnnouncingItsTimeoutAsync(): Promise<void> {
    const messages = await this.runAsync(["hanging-fixture"], t => t.runAsync(new TestWorkerRun(0, 0, true)));

    Assert.areEqual("Imported hanging-fixture.test.js,Ready 1.2,Started 0.0,MethodCompleted 0.0,Started 0.1,MethodCompleted 0.1,ClassCompleted 0",
      messages.map(t => TestRunWorkerTests.describe(t)).join());
    Assert.areEqual(TestOutcome.Failed, messages[3]!.result?.methodResult.outcome);
  }

  @TestMethod
  public async runsTheClassThatThePortNamesAsync(): Promise<void> {
    const messages = await this.runAsync(["hanging-fixture", "passing-fixture"], async (_, port) => port.postMessage(new TestWorkerRun(1, 0, false).toData()));

    Assert.areEqual("Imported hanging-fixture.test.js,Imported passing-fixture.test.js,Ready 2.3,Started 1.0,MethodCompleted 1.0,ClassCompleted 1",
      messages.map(t => TestRunWorkerTests.describe(t)).join());
  }

  @TestMethod
  public async rejectsAStartTestItCannotFindAsync(): Promise<void> {
    await Assert.throwsAsync(() => this.runAsync(["hanging-fixture"], t => t.runAsync(new TestWorkerRun(0, 5, false))), TestingException);
  }

  @TestMethod
  public async rejectsAClassItCannotFindAsync(): Promise<void> {
    await Assert.throwsAsync(() => this.runAsync(["hanging-fixture"], t => t.runAsync(new TestWorkerRun(5, 0, false))), TestingException);
  }

  @TestMethod
  public async failsAClassThatLeavesAResourceOpenAsync(): Promise<void> {
    const resourceCount = process.getActiveResourcesInfo().length;
    const project = await FixtureTestProject.createAsync(["leaking-timer-fixture"]);
    const channel = new MessageChannel();
    try {
      const worker = new TestRunWorker(channel.port1, new TestWorkerStart([project.testProject], [], 100));
      await worker.startAsync();

      const failure = await Assert.throwsAsync(() => worker.runAsync(new TestWorkerRun(0, 0, false)), TestingException);

      Assert.isTrue(failure.message.endsWith("LeakingTimerFixtureTests left Timeout open after its tests finished; a test must close what it opens."),
        failure.message);
    }
    finally {
      LeakingTimerFixtureTests.release();
      await TestRunWorkerTests.closeAsync(channel);
      await project.removeAsync();
    }

    await new Promise<void>(resolve => setImmediate(resolve));
    Assert.isTrue(process.getActiveResourcesInfo().length <= resourceCount,
      `Expected nothing left open a loop turn after the ports closed, as the worker checks a class; open: ${process.getActiveResourcesInfo().join()}`);
  }

  @TestMethod
  public async completesAClassThatAwaitsItsOwnCloseAsync(): Promise<void> {
    const messages = await this.runAsync(["closing-port-fixture"], t => t.runAsync(new TestWorkerRun(0, 0, false)));

    Assert.areEqual("Imported closing-port-fixture.test.js,Ready 1.1,Started 0.0,MethodCompleted 0.0,ClassCompleted 0",
      messages.map(t => TestRunWorkerTests.describe(t)).join());
  }

  private async runAsync(fixtureNames: readonly string[], act: (worker: TestRunWorker, port: MessagePort) => Promise<void>,
    endingKinds: readonly TestWorkerMessageKind[] = [TestWorkerMessageKind.ClassCompleted, TestWorkerMessageKind.TimedOut],
    filters: readonly string[] = [], clock?: IClock): Promise<TestWorkerMessage[]> {
    const project = await FixtureTestProject.createAsync(fixtureNames);
    const channel = new MessageChannel();
    const messages: TestWorkerMessage[] = [];
    const listeners = process.listeners("unhandledRejection");
    try {
      const ended = new Promise<void>(resolve => channel.port2.on("message", (value: unknown) => {
        const message = TestWorkerMessage.from(value);
        messages.push(message);
        if (endingKinds.includes(message.kind))
          resolve();
      }));
      const worker = new TestRunWorker(channel.port1, new TestWorkerStart([project.testProject], filters, 100), clock);
      await worker.startAsync();
      await act(worker, channel.port2);
      await ended;

      return messages;
    }
    finally {
      for (const listener of process.listeners("unhandledRejection"))
        if (!listeners.includes(listener))
          process.off("unhandledRejection", listener);

      await TestRunWorkerTests.closeAsync(channel);
      await project.removeAsync();
    }
  }

  private static async closeAsync(channel: MessageChannel): Promise<void> {
    const closed = Promise.all([once(channel.port1, "close"), once(channel.port2, "close")]);
    channel.port1.close();
    channel.port2.close();
    await closed;
  }

  private static describe(message: TestWorkerMessage): string {
    if (message.kind === TestWorkerMessageKind.Imported)
      return `${message.kind} ${message.filePath}`;

    if (message.kind === TestWorkerMessageKind.Ready)
      return `${message.kind} ${message.classCount}.${message.methodCount}`;

    return message.kind === TestWorkerMessageKind.ClassCompleted
      ? `${message.kind} ${message.classIndex}`
      : `${message.kind} ${message.classIndex}.${message.methodIndex}`;
  }
}
