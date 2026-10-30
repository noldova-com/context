/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ITestProgressListener, TestClassResult } from "@noldova/context.testing";

export class RecordingTestProgress implements ITestProgressListener {
  public readonly events: string[] = [];
  public readonly results: TestClassResult[] = [];
  private readonly completionFailure: Error | undefined;

  public constructor(completionFailure?: Error) {
    this.completionFailure = completionFailure;
  }

  public onClassCompleted(classResult: TestClassResult): void {
    this.events.push(`complete:${classResult.className}`);
    this.results.push(classResult);
    if (!Object.isUndefined(this.completionFailure))
      throw this.completionFailure;
  }
}
