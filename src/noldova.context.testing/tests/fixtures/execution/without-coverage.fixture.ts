/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

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
