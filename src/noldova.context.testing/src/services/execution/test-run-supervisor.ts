/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { availableParallelism } from "node:os";
import { Worker, type WorkerOptions } from "node:worker_threads";

import "@noldova/context.core";
import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";

import { TestWorkerMessageKind } from "../../enums/test-worker-message-kind.js";
import { TestingException } from "../../exceptions/testing.exception.js";
import type { IClock } from "../../interfaces/i-clock.js";
import type { ITestProgressListener } from "../../interfaces/i-test-progress-listener.js";
import type { TestProject } from "../../models/discovery/test-project.js";
import { TestWorkerMessage } from "../../models/execution/test-worker-message.js";
import { TestWorkerRun } from "../../models/execution/test-worker-run.js";
import { TestWorkerStart } from "../../models/execution/test-worker-start.js";
import { TestClassResult } from "../../models/results/test-class-result.js";
import type { TestMethodResult } from "../../models/results/test-method-result.js";
import { TestRunResult } from "../../models/results/test-run-result.js";
import { TestSelection } from "../../models/results/test-selection.js";
import { Resources } from "../../resources.js";
import { SystemClock } from "../timing/system-clock.js";

export class TestRunSupervisor {
  private readonly timeoutMilliseconds: number;
  private readonly testProjects: readonly TestProject[];
  private readonly filters: readonly string[];
  private readonly progressListener: ITestProgressListener | undefined;
  private readonly workerUrl: URL;
  private readonly workerCount: number;
  private readonly startLimitMilliseconds: number;
  private readonly createWorker: (url: URL, options: WorkerOptions) => Worker;
  private readonly clock: IClock;
  private readonly runs: TestWorkerRun[];
  private readonly workers: Map<Worker, () => Promise<void>>;
  private readonly methodResults: Map<number, TestMethodResult[]>;
  private readonly finishedClassResults: Map<number, TestClassResult>;
  private readonly classResults: TestClassResult[];
  private isQueued: boolean;
  private isFailed: boolean;
  private classCount: number;
  private methodCount: number;
  private selectionValue: TestSelection;
  private elapsedMillisecondsValue: number;

  public constructor(timeoutMilliseconds: number, testProjects: readonly TestProject[], filters: readonly string[],
    progressListener: ITestProgressListener | undefined, workerUrl: URL = new URL(Resources.testRunWorkerFileName, import.meta.url),
    workerCount: number = TestRunSupervisor.defaultWorkerCount(),
    startLimitMilliseconds: number = Resources.testWorkerStartMilliseconds,
    createWorker: (url: URL, options: WorkerOptions) => Worker = (url, options) => new Worker(url, options),
    clock: IClock = new SystemClock()) {
    TestRunSupervisor.throwIfLimitsInvalid(timeoutMilliseconds, workerCount);
    ArgumentOutOfRangeException.throwIfNotPositiveInteger(startLimitMilliseconds, Resources.startLimitMillisecondsParameter, Resources.startLimitInvalid);
    if (startLimitMilliseconds > Resources.maximumTimeoutMilliseconds)
      throw new ArgumentOutOfRangeException(Resources.startLimitMillisecondsParameter, startLimitMilliseconds, Resources.timeoutTooLarge);

    this.timeoutMilliseconds = timeoutMilliseconds;
    this.testProjects = testProjects;
    this.filters = filters;
    this.progressListener = progressListener;
    this.workerUrl = workerUrl;
    this.workerCount = workerCount;
    this.startLimitMilliseconds = startLimitMilliseconds;
    this.createWorker = createWorker;
    this.clock = clock;
    this.runs = [];
    this.workers = new Map();
    this.methodResults = new Map();
    this.finishedClassResults = new Map();
    this.classResults = [];
    this.isQueued = false;
    this.isFailed = false;
    this.classCount = 0;
    this.methodCount = 0;
    this.selectionValue = new TestSelection(filters, 0, 0);
    this.elapsedMillisecondsValue = 0;
  }

  public get selection(): TestSelection {
    return this.selectionValue;
  }

  public get elapsedMilliseconds(): number {
    return this.elapsedMillisecondsValue;
  }

  public static defaultWorkerCount(): number {
    return Math.max(availableParallelism(), Resources.minimumWorkerCount);
  }

  public static throwIfLimitsInvalid(timeoutMilliseconds: number, workerCount: number): void {
    ArgumentOutOfRangeException.throwIfNotPositiveInteger(timeoutMilliseconds, Resources.timeoutMillisecondsParameter, Resources.timeoutInvalid);
    if (timeoutMilliseconds + Resources.testWorkerGraceMilliseconds > Resources.maximumTimeoutMilliseconds)
      throw new ArgumentOutOfRangeException(Resources.timeoutMillisecondsParameter, timeoutMilliseconds, Resources.timeoutTooLarge);

    ArgumentOutOfRangeException.throwIfNotPositiveInteger(workerCount, Resources.workerCountParameter, Resources.workerCountInvalid);
  }

  public async runAsync(): Promise<TestRunResult> {
    const start = this.clock.now();
    await new Promise<void>((resolve, reject) => {
      for (let index = 0; index < this.workerCount; index++)
        this.startWorker(resolve, reject);
    });

    const result = new TestRunResult(this.classResults, this.selection);
    if (result.total !== this.methodCount)
      throw new TestingException(Resources.runResultCountMismatch(result.total, this.methodCount));

    this.elapsedMillisecondsValue = this.clock.now() - start;
    return result;
  }

  private startWorker(resolve: () => void, reject: (error: unknown) => void): void {
    const start = new TestWorkerStart(this.testProjects, this.filters, this.timeoutMilliseconds);
    const worker = this.createWorker(this.workerUrl, { workerData: start.toData() });
    const startLimitMilliseconds = Math.max(this.timeoutMilliseconds + Resources.testWorkerGraceMilliseconds, this.startLimitMilliseconds);
    let started: TestWorkerMessage | undefined;
    let imported: string | undefined;
    let watchdog: number | undefined;
    let isStopping = false;
    const stopAsync = async (): Promise<void> => {
      isStopping = true;
      this.clock.clearTimeout(watchdog);
      worker.removeAllListeners(Resources.messageEvent);
      worker.removeAllListeners(Resources.exitEvent);
      await Promise.allSettled([worker.terminate()]);
    };
    const finish = (): void => {
      this.workers.delete(worker);
      if (this.workers.size === 0 && !this.isFailed)
        resolve();
    };
    // A worker with no run left ends by itself, so its thread writes its coverage; it is ended only when it does not end within the limit.
    const end = (): void => {
      isStopping = true;
      worker.removeAllListeners(Resources.messageEvent);
      worker.removeAllListeners(Resources.exitEvent);
      worker.once(Resources.exitEvent, () => {
        this.clock.clearTimeout(watchdog);
        finish();
      });
      this.clock.clearTimeout(watchdog);
      watchdog = this.clock.setTimeout(() => void stopAsync().then(finish), Resources.testWorkerEndMilliseconds);
      worker.postMessage(undefined);
    };
    const fail = (error: unknown): void => {
      this.isFailed = true;
      this.runs.length = 0;
      void Promise.all([...this.workers.values()].map(stopWorkerAsync => stopWorkerAsync())).then(() => reject(error));
    };
    const replace = (ending: TestWorkerMessage): void => {
      void stopAsync().then(() => {
        if (!this.isFailed)
          this.timeOut(ending);

        if (this.runs.length === 0)
          finish();
        else {
          this.workers.delete(worker);
          this.startWorker(resolve, reject);
        }
      }).catch(fail);
    };
    const arm = (limitMilliseconds: number = this.timeoutMilliseconds + Resources.testWorkerGraceMilliseconds): void => {
      this.clock.clearTimeout(watchdog);
      watchdog = this.clock.setTimeout(() => Object.isUndefined(started)
        ? fail(new TestingException(Object.isUndefined(imported) ? Resources.testWorkerStalled(limitMilliseconds)
          : Resources.testWorkerStalledAfterImport(limitMilliseconds, imported)))
        : replace(TestWorkerMessage.timedOut(started.classIndex, started.methodIndex, String.empty)), limitMilliseconds);
    };
    const runNext = (): void => {
      const run = this.runs.shift();
      if (Object.isUndefined(run)) {
        end();
        return;
      }

      worker.postMessage(run.toData());
      arm();
    };

    this.workers.set(worker, stopAsync);
    worker.on(Resources.messageEvent, (value: unknown) => {
      try {
        const message = TestWorkerMessage.from(value);
        if (message.kind === TestWorkerMessageKind.Imported) {
          imported = message.filePath;
          arm(startLimitMilliseconds);
        }
        else if (message.kind === TestWorkerMessageKind.Ready) {
          imported = undefined;
          this.queue(message);
          runNext();
        }
        else if (message.kind === TestWorkerMessageKind.Started) {
          started = message;
          arm();
        }
        else if (message.kind === TestWorkerMessageKind.MethodCompleted) {
          this.completeMethod(message);
          started = undefined;
          arm();
        }
        else if (message.kind === TestWorkerMessageKind.ClassCompleted) {
          this.completeClass(message.classIndex, message.filePath);
          started = undefined;
          runNext();
        }
        else
          replace(message);
      }
      catch (error) {
        fail(error);
      }
    });
    worker.on(Resources.errorEvent, (error: unknown) => {
      if (!isStopping)
        fail(error);
    });
    worker.on(Resources.exitEvent, (code: number) => fail(new TestingException(Resources.testWorkerEnded(code))));
    arm(startLimitMilliseconds);
  }

  private queue(ready: TestWorkerMessage): void {
    if (this.isQueued) {
      if (ready.classCount !== this.classCount || ready.methodCount !== this.methodCount || ready.discoveredCount !== this.selection.discovered)
        throw new TestingException(Resources.testWorkerDiscoveryMismatch(this.classCount, this.methodCount, ready.classCount, ready.methodCount));

      return;
    }

    this.isQueued = true;
    this.classCount = ready.classCount;
    this.methodCount = ready.methodCount;
    this.selectionValue = new TestSelection(this.filters, ready.discoveredCount, ready.methodCount);
    for (let classIndex = 0; classIndex < ready.classCount; classIndex++)
      this.runs.push(new TestWorkerRun(classIndex, 0, false));
  }

  private timeOut(ending: TestWorkerMessage): void {
    if (ending.filePath !== String.empty) {
      this.completeClass(ending.classIndex, ending.filePath);
      return;
    }

    const nextMethodIndex = this.getMethodResults(ending.classIndex).length;
    this.runs.unshift(new TestWorkerRun(ending.classIndex, nextMethodIndex, ending.methodIndex === nextMethodIndex));
  }

  private completeMethod(message: TestWorkerMessage): void {
    if (Object.isUndefined(message.result))
      throw new TestingException(Resources.testWorkerDataInvalid);

    this.methodResults.set(message.classIndex, [...this.getMethodResults(message.classIndex), message.result.methodResult]);
    this.progressListener?.onMethodCompleted?.(message.result.methodResult);
  }

  private completeClass(classIndex: number, filePath: string): void {
    const methodResults = this.getMethodResults(classIndex);
    const [firstResult] = methodResults;
    if (Object.isUndefined(firstResult))
      throw new TestingException(Resources.testWorkerDataInvalid);

    this.finishedClassResults.set(classIndex, new TestClassResult(firstResult.packageName, firstResult.className, filePath, methodResults));
    this.methodResults.delete(classIndex);
    for (let classResult = this.finishedClassResults.get(this.classResults.length); !Object.isUndefined(classResult);
      classResult = this.finishedClassResults.get(this.classResults.length)) {
      this.finishedClassResults.delete(this.classResults.length);
      this.classResults.push(classResult);
      this.progressListener?.onClassCompleted(classResult);
    }
  }

  private getMethodResults(classIndex: number): TestMethodResult[] {
    return this.methodResults.get(classIndex) ?? [];
  }
}
