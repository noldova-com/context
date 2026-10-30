/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import type { MessagePort } from "node:worker_threads";

import "@noldova/context.core";

import { TestTimeoutException } from "../../exceptions/test-timeout.exception.js";
import { TestingException } from "../../exceptions/testing.exception.js";
import type { IClock } from "../../interfaces/i-clock.js";
import type { ITestProgressListener } from "../../interfaces/i-test-progress-listener.js";
import { DiscoveredTestClass } from "../../models/discovery/discovered-test-class.js";
import type { DiscoveredTestMethod } from "../../models/discovery/discovered-test-method.js";
import { TestWorkerMessage } from "../../models/execution/test-worker-message.js";
import { TestWorkerResult } from "../../models/execution/test-worker-result.js";
import { TestWorkerRun } from "../../models/execution/test-worker-run.js";
import type { TestWorkerStart } from "../../models/execution/test-worker-start.js";
import type { TestClassResult } from "../../models/results/test-class-result.js";
import type { TestMethodResult } from "../../models/results/test-method-result.js";
import { Resources } from "../../resources.js";
import { TestDiscovery } from "../discovery/test-discovery.js";
import { TestReportWriter } from "../reporting/test-report-writer.js";
import { SystemClock } from "../timing/system-clock.js";
import { TestExecutor } from "./test-executor.js";
import { TestRunner } from "./test-runner.js";

export class TestRunWorker implements ITestProgressListener {
  private static readonly IGNORE_ABANDONED_REJECTION = (): void => undefined;

  private readonly port: MessagePort;
  private readonly start: TestWorkerStart;
  private readonly reportWriter: TestReportWriter;
  private readonly executor: TestExecutor;
  private selected: readonly DiscoveredTestClass[];
  private stoppedMethods: ReadonlySet<DiscoveredTestMethod>;
  private timedOut: TestWorkerMessage | undefined;
  private classIndex: number;
  private methodIndex: number;
  private isRunningStoppedMethod: boolean;
  private baseline: readonly string[];

  public constructor(port: MessagePort, start: TestWorkerStart, clock: IClock = new SystemClock()) {
    this.port = port;
    this.start = start;
    this.reportWriter = new TestReportWriter();
    this.executor = new TestExecutor(start.timeoutMilliseconds, clock);
    this.selected = [];
    this.stoppedMethods = new Set();
    this.timedOut = undefined;
    this.classIndex = 0;
    this.methodIndex = -1;
    this.isRunningStoppedMethod = false;
    this.baseline = [];
  }

  public async startAsync(): Promise<void> {
    const discovery = new TestDiscovery();
    const discovered = await discovery.discoverAsync(this.start.testProjects, filePath => this.post(TestWorkerMessage.imported(filePath)));
    this.selected = new TestRunner(discovery, this.executor).select(discovered, this.start.filters);
    this.port.on(Resources.messageEvent, (value: unknown) => void this.runAsync(TestWorkerRun.from(value)));
    this.baseline = process.getActiveResourcesInfo();
    this.post(TestWorkerMessage.ready(this.selected.length, TestRunWorker.countMethods(this.selected), TestRunWorker.countMethods(discovered)));
  }

  public async runAsync(run: TestWorkerRun): Promise<void> {
    const testClass = this.selected[run.classIndex];
    const methods = testClass?.methods.slice(run.startMethodIndex) ?? [];
    const [startMethod] = methods;
    if (Object.isUndefined(testClass) || Object.isUndefined(startMethod))
      throw new TestingException(Resources.testWorkerDataInvalid);

    this.stoppedMethods = run.isStartMethodStopped ? new Set([startMethod]) : new Set();
    this.classIndex = run.classIndex;
    this.methodIndex = run.startMethodIndex - 1;
    const classResults = await this.executor.executeAsync([new DiscoveredTestClass(testClass.packageName, testClass.className, testClass.filePath,
      testClass.testClassConstructor, testClass.skipReason, methods, testClass.categories)], this, this.stoppedMethods, () => !Object.isUndefined(this.timedOut));
    if (!Object.isUndefined(this.timedOut)) {
      this.post(this.timedOut);
      return;
    }

    for (const classResult of classResults) {
      const heading = this.reportWriter.formatClassHeading(classResult);
      const openResources = this.findOpenResources();
      if (openResources.length > 0)
        throw new TestingException(Resources.formatTestResourcesOpen(heading, openResources));

      this.post(TestWorkerMessage.classCompleted(this.classIndex, classResult.filePath));
    }
  }

  public onMethodStarted(_testClass: DiscoveredTestClass, method: DiscoveredTestMethod): void {
    this.methodIndex++;
    this.isRunningStoppedMethod = this.stoppedMethods.has(method);
    this.post(TestWorkerMessage.started(this.classIndex, this.methodIndex));
  }

  public onMethodCompleted(methodResult: TestMethodResult): void {
    this.post(TestWorkerMessage.methodCompleted(this.classIndex, this.methodIndex, new TestWorkerResult(methodResult)));
    if (!(methodResult.failure instanceof TestTimeoutException) || this.isRunningStoppedMethod)
      return;

    this.timedOut = TestWorkerMessage.timedOut(this.classIndex, this.methodIndex, String.empty);
    if (!process.listeners(Resources.unhandledRejectionEvent).includes(TestRunWorker.IGNORE_ABANDONED_REJECTION))
      process.on(Resources.unhandledRejectionEvent, TestRunWorker.IGNORE_ABANDONED_REJECTION);
  }

  public onClassCompleted(classResult: TestClassResult): void {
    if (!Object.isUndefined(this.timedOut))
      this.timedOut = TestWorkerMessage.timedOut(this.timedOut.classIndex, this.timedOut.methodIndex, classResult.filePath);
  }

  private static countMethods(testClasses: readonly DiscoveredTestClass[]): number {
    return testClasses.reduce((count, testClass) => count + testClass.methods.length, 0);
  }

  private findOpenResources(): string[] {
    const open = process.getActiveResourcesInfo();
    for (const resource of this.baseline) {
      const index = open.indexOf(resource);
      if (index >= 0)
        open.splice(index, 1);
    }

    return open;
  }

  private post(message: TestWorkerMessage): void {
    this.port.postMessage(message.toData());
  }
}
