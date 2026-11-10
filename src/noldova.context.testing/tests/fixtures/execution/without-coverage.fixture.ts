/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

// Runs an action with the coverage variable removed from this thread's environment, so the workers and processes it starts collect no
// coverage. A test starts its workers this way when it stops them on purpose: a stopped thread drops its profile, and Node reports a profile
// it was serializing when stopped on standard error.
export class WithoutCoverage {
  private static readonly COVERAGE_VARIABLE: string = "NODE_V8_COVERAGE";

  public static async runAsync<T>(action: () => Promise<T>): Promise<T> {
    const coverageDirectory = process.env[WithoutCoverage.COVERAGE_VARIABLE];
    delete process.env[WithoutCoverage.COVERAGE_VARIABLE];
    try {
      return await action();
    }
    finally {
      if (!Object.isUndefined(coverageDirectory))
        process.env[WithoutCoverage.COVERAGE_VARIABLE] = coverageDirectory;
    }
  }
}
