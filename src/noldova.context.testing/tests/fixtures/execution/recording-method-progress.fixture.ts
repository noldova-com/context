/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiscoveredTestClass, DiscoveredTestMethod, ITestProgressListener, TestClassResult, TestMethodResult } from "@noldova/context.testing";

export class RecordingMethodProgress implements ITestProgressListener {
  public readonly events: string[] = [];

  public onMethodStarted(testClass: DiscoveredTestClass, method: DiscoveredTestMethod): void {
    this.events.push(`start:${testClass.className}.${method.displayName}`);
  }

  public onMethodCompleted(methodResult: TestMethodResult): void {
    this.events.push(`complete:${methodResult.methodName}:${methodResult.outcome}`);
  }

  public onClassCompleted(classResult: TestClassResult): void {
    this.events.push(`class:${classResult.className}`);
  }
}
