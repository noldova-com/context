/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { AsyncLocalStorage } from "node:async_hooks";

import { ArgumentOutOfRangeException, ExceptionOptions } from "@noldova/context.exceptions";

import { TestOutcome } from "../../enums/test-outcome.js";
import { TestTimeoutException } from "../../exceptions/test-timeout.exception.js";
import { TestingException } from "../../exceptions/testing.exception.js";
import type { IClock } from "../../interfaces/i-clock.js";
import type { ITestProgressListener } from "../../interfaces/i-test-progress-listener.js";
import type { DiscoveredTestClass } from "../../models/discovery/discovered-test-class.js";
import type { DiscoveredTestMethod } from "../../models/discovery/discovered-test-method.js";
import { TestContext } from "../../models/execution/test-context.js";
import { TestClassResult } from "../../models/results/test-class-result.js";
import { TestMethodResult } from "../../models/results/test-method-result.js";
import { Resources } from "../../resources.js";
import type { StrayFailureRecorder } from "../../types/stray-failure-recorder.js";
import { SystemClock } from "../timing/system-clock.js";

export class TestExecutor {
  private static readonly FAILURE_STORAGE: AsyncLocalStorage<StrayFailureRecorder> = new AsyncLocalStorage<StrayFailureRecorder>();

  private static readonly ON_UNHANDLED_REJECTION = (t: unknown): void => {
    const record = TestExecutor.FAILURE_STORAGE.getStore();
    if (Object.isUndefined(record))
      throw t;

    record(t, Resources.formatRejectedAfterItsTest);
  };

  private static readonly ON_UNCAUGHT_EXCEPTION = (t: unknown): void => {
    const record = TestExecutor.FAILURE_STORAGE.getStore();
    if (Object.isUndefined(record)) {
      process.off(Resources.uncaughtExceptionEvent, TestExecutor.ON_UNCAUGHT_EXCEPTION);
      process.nextTick(() => {
        throw t;
      });
      return;
    }

    record(t, Resources.formatThrewAfterItsTest);
  };

  private readonly timeoutMilliseconds: number;
  private readonly clock: IClock;
  private lateFailure: TestingException | undefined;

  public constructor(timeoutMilliseconds: number, clock: IClock = new SystemClock()) {
    ArgumentOutOfRangeException.throwIfNotPositiveInteger(timeoutMilliseconds, Resources.timeoutMillisecondsParameter, Resources.timeoutInvalid);
    if (timeoutMilliseconds > Resources.maximumTimeoutMilliseconds)
      throw new ArgumentOutOfRangeException(Resources.timeoutMillisecondsParameter, timeoutMilliseconds, Resources.timeoutTooLarge);

    this.timeoutMilliseconds = timeoutMilliseconds;
    this.clock = clock;
    this.lateFailure = undefined;
  }

  public getTimeoutMilliseconds(method: DiscoveredTestMethod): number {
    return method.timeoutMilliseconds ?? this.timeoutMilliseconds;
  }

  public async executeAsync(testClasses: readonly DiscoveredTestClass[], progressListener?: ITestProgressListener,
    stoppedMethods: ReadonlySet<DiscoveredTestMethod> = new Set(), isStopping?: () => boolean): Promise<TestClassResult[]> {
    const ownsRejectionListener = !process.listeners(Resources.unhandledRejectionEvent).includes(TestExecutor.ON_UNHANDLED_REJECTION);
    if (ownsRejectionListener)
      process.on(Resources.unhandledRejectionEvent, TestExecutor.ON_UNHANDLED_REJECTION);
    const ownsExceptionListener = !process.listeners(Resources.uncaughtExceptionEvent).includes(TestExecutor.ON_UNCAUGHT_EXCEPTION);
    if (ownsExceptionListener)
      process.on(Resources.uncaughtExceptionEvent, TestExecutor.ON_UNCAUGHT_EXCEPTION);

    try {
      const classResults: TestClassResult[] = [];
      for (const testClass of testClasses) {
        const methodResults: TestMethodResult[] = [];
        for (const method of testClass.methods) {
          if (isStopping?.() === true)
            return classResults;

          progressListener?.onMethodStarted?.(testClass, method);
          const methodResult = stoppedMethods.has(method)
            ? this.createStoppedResult(testClass, method)
            : await this.executeMethodAsync(testClass, method);
          methodResults.push(methodResult);
          progressListener?.onMethodCompleted?.(methodResult);
        }

        if (!Object.isUndefined(this.lateFailure))
          throw this.lateFailure;

        const classResult = new TestClassResult(testClass.packageName, testClass.className, testClass.filePath, methodResults);
        classResults.push(classResult);
        progressListener?.onClassCompleted(classResult);
      }

      return classResults;
    }
    finally {
      if (ownsRejectionListener)
        process.off(Resources.unhandledRejectionEvent, TestExecutor.ON_UNHANDLED_REJECTION);
      if (ownsExceptionListener)
        process.off(Resources.uncaughtExceptionEvent, TestExecutor.ON_UNCAUGHT_EXCEPTION);
    }
  }

  private createStoppedResult(testClass: DiscoveredTestClass, method: DiscoveredTestMethod): TestMethodResult {
    return new TestMethodResult(
      testClass.packageName,
      testClass.className,
      method.methodName,
      method.testDataIndex,
      method.testData,
      TestOutcome.Failed,
      this.getTimeoutMilliseconds(method),
      new TestTimeoutException(this.getTimeoutMilliseconds(method)),
      undefined);
  }

  private async executeMethodAsync(testClass: DiscoveredTestClass, method: DiscoveredTestMethod): Promise<TestMethodResult> {
    const skipReason = method.skipReason ?? testClass.skipReason;
    if (!Object.isUndefined(skipReason))
      return new TestMethodResult(
        testClass.packageName,
        testClass.className,
        method.methodName,
        method.testDataIndex,
        method.testData,
        TestOutcome.Skipped,
        0,
        undefined,
        skipReason);

    const strayFailures: unknown[] = [];
    let endedAs: string | undefined;
    const record: StrayFailureRecorder = (failure, formatLate) => {
      if (Object.isUndefined(endedAs))
        strayFailures.push(failure);
      else
        this.lateFailure ??= new TestingException(formatLate(endedAs), new ExceptionOptions(failure));
    };
    const context = new TestContext();
    const start = this.clock.now();
    let didFail = false;
    let failure: unknown;

    try {
      await TestContext.runAsync(context, async () => {
        await TestExecutor.FAILURE_STORAGE.run(record, async () => {
          try {
            await this.invokeWithTimeoutAsync(testClass, method);
          }
          finally {
            await this.drainPendingRejectionsAsync();
          }
        });
      });

      if (strayFailures.length > 0) {
        didFail = true;
        failure = strayFailures[0];
      }
    }
    catch (exception) {
      didFail = true;
      failure = exception;
    }

    context.end();
    const methodResult = new TestMethodResult(
      testClass.packageName,
      testClass.className,
      method.methodName,
      method.testDataIndex,
      method.testData,
      didFail ? TestOutcome.Failed : TestOutcome.Passed,
      this.clock.now() - start,
      failure,
      undefined,
      context.attachments);
    endedAs = methodResult.displayName;
    return methodResult;
  }

  private async invokeWithTimeoutAsync(testClass: DiscoveredTestClass, method: DiscoveredTestMethod): Promise<void> {
    const instance: object = new testClass.testClassConstructor();
    const testMethod: unknown = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(instance), method.methodName)?.value;
    if (!Object.isFunction(testMethod))
      throw new TestingException(Resources.methodNotCallable(method.methodName, testClass.className));

    const timeoutMilliseconds = this.getTimeoutMilliseconds(method);
    let timeoutHandle: number | undefined;
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      timeoutHandle = this.clock.setTimeout(() => reject(new TestTimeoutException(timeoutMilliseconds)), timeoutMilliseconds);
    });

    try {
      await Promise.race([Promise.resolve(testMethod.call(instance, ...method.testData)), timeoutPromise]);
    }
    finally {
      this.clock.clearTimeout(timeoutHandle);
    }
  }

  private async drainPendingRejectionsAsync(): Promise<void> {
    await new Promise<void>(t => setImmediate(t));
  }
}
