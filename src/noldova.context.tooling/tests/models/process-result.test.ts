/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";
import { ProcessResult } from "@noldova/context.tooling";

@TestClass
export class ProcessResultTests {
  @TestMethod
  public keepsItsValues(): void {
    const result = new ProcessResult(2, "output", "error output");

    Assert.areEqual(2, result.exitCode);
    Assert.areEqual("output", result.output);
    Assert.areEqual("error output", result.errorOutput);
  }

  @TestMethod
  @TestData(0, true)
  @TestData(1, false)
  @TestData(null, false)
  public succeedsOnlyWithExitCodeZero(exitCode: number | null, isSuccessful: boolean): void {
    Assert.areEqual(isSuccessful, new ProcessResult(exitCode, "", "").isSuccessful);
  }
}
