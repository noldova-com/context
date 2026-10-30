/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { AsyncLocalStorage } from "node:async_hooks";

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";

import { TestOutcome } from "../../enums/test-outcome.js";
import { TestTimeoutException } from "../../exceptions/test-timeout.exception.js";
import { TestingException } from "../../exceptions/testing.exception.js";
import type { IClock } from "../../interfaces/i-clock.js";
import type { ITestProgressListener } from "../../interfaces/i-test-progress-listener.js";
import type { DiscoveredTestClass } from "../../models/discovery/discovered-test-class.js";
import type { DiscoveredTestMethod } from "../../models/discovery/discovered-test-method.js";
import { TestClassResult } from "../../models/results/test-class-result.js";
import { TestMethodResult } from "../../models/results/test-method-result.js";
import { Resources } from "../../resources.js";
import { SystemClock } from "../timing/system-clock.js";

export class TestExecutor {
  private static readonly REJECTION_STORAGE: AsyncLocalStorage<unknown[]> = new AsyncLocalStorage<unknown[]>();

  private static readonly ON_UNHANDLED_REJECTION = (t: unknown): void => {
    const rejections = TestExecutor.REJECTION_STORAGE.getStore();
    if (Object.isUndefined(rejections))
      throw t;

    rejections.push(t);
  };

  private readonly timeoutMilliseconds: number;
  private readonly clock: IClock;

  public constructor(timeoutMilliseconds: number, clock: IClock = new SystemClock()) {
    ArgumentOutOfRangeException.throwIfNotPositiveInteger(timeoutMilliseconds, Resources.timeoutMillisecondsParameter, Resources.timeoutInvalid);
    if (timeoutMilliseconds > Resources.maximumTimeoutMilliseconds)
      throw new ArgumentOutOfRangeException(Resources.timeoutMillisecondsParameter, timeoutMilliseconds, Resources.timeoutTooLarge);

    this.timeoutMilliseconds = timeoutMilliseconds;
    this.clock = clock;
  }

  public async executeAsync(testClasses: readonly DiscoveredTestClass[], progressListener?: ITestProgressListener,
    stoppedMethods: ReadonlySet<DiscoveredTestMethod> = new Set(), isStopping?: () => boolean): Promise<TestClassResult[]> {
    const ownsRejectionListener = !process.listeners(Resources.unhandledRejectionEvent).includes(TestExecutor.ON_UNHANDLED_REJECTION);
    if (ownsRejectionListener)
      process.on(Resources.unhandledRejectionEvent, TestExecutor.ON_UNHANDLED_REJECTION);

    try {
      const classResults: TestClassResult[] = [];
      for (const testClass of testClasses) {
        const methodResults: TestMethodResult[] = [];
        for (const method of testClass.methods) {
          if (isStopping?.() === true)
            return classResults;

          progressListener?.onMethodStarted?.(testClass, method);
          const methodResult = stoppedMethods.has(method) ? this.createStoppedResult(testClass, method) : await this.executeMethodAsync(testClass, method);
          methodResults.push(methodResult);
          progressListener?.onMethodCompleted?.(methodResult);
        }

        const classResult = new TestClassResult(testClass.packageName, testClass.className, testClass.filePath, methodResults);
        classResults.push(classResult);
        progressListener?.onClassCompleted(classResult);
      }

      return classResults;
    }
    finally {
      if (ownsRejectionListener)
        process.off(Resources.unhandledRejectionEvent, TestExecutor.ON_UNHANDLED_REJECTION);
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
      this.timeoutMilliseconds,
      new TestTimeoutException(this.timeoutMilliseconds),
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

    const start = this.clock.now();
    const unhandledRejections: unknown[] = [];
    let didFail = false;
    let failure: unknown;

    try {
      await TestExecutor.REJECTION_STORAGE.run(unhandledRejections, async () => {
        try {
          await this.invokeWithTimeoutAsync(testClass, method);
        }
        finally {
          await this.drainPendingRejectionsAsync();
        }
      });

      if (unhandledRejections.length > 0) {
        didFail = true;
        failure = unhandledRejections[0];
      }
    }
    catch (error) {
      didFail = true;
      failure = error;
    }

    const durationMilliseconds = this.clock.now() - start;
    if (didFail)
      return new TestMethodResult(
        testClass.packageName,
        testClass.className,
        method.methodName,
        method.testDataIndex,
        method.testData,
        TestOutcome.Failed,
        durationMilliseconds,
        failure,
        undefined);

    return new TestMethodResult(
      testClass.packageName,
      testClass.className,
      method.methodName,
      method.testDataIndex,
      method.testData,
      TestOutcome.Passed,
      durationMilliseconds,
      undefined,
      undefined);
  }

  private async invokeWithTimeoutAsync(testClass: DiscoveredTestClass, method: DiscoveredTestMethod): Promise<void> {
    const instance: object = new testClass.testClassConstructor();
    const testMethod: unknown = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(instance), method.methodName)?.value;
    if (!Object.isFunction(testMethod))
      throw new TestingException(Resources.methodNotCallable(method.methodName, testClass.className));

    let timeoutHandle: number | undefined;
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      timeoutHandle = this.clock.setTimeout(() => reject(new TestTimeoutException(this.timeoutMilliseconds)), this.timeoutMilliseconds);
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
