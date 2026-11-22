/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { ProcessDescendants } from "@noldova/context.testing/models/execution/process-descendants.js";

@TestClass
export class ProcessDescendantsTests {
  @TestMethod
  public describesAOneOffListingWithTheRunAndNoBrokenChain(): void {
    Assert.areEqual("Its one-off listing took 312 ms and held 470 processes, the run's own process among them, and it shows no process started after " +
      "the run under a parent that has gone.", new ProcessDescendants([], false, 312, 470, true, []).describe());
  }

  @TestMethod
  public describesAWarmListingWithoutTheRunOrStartTimes(): void {
    Assert.areEqual("Its warm listing took 4 ms and held 2 processes, but not the run's own process, and it gives no start times to find the processes " +
      "started after the run under a parent that has gone.", new ProcessDescendants([21], true, 4, 2, false, undefined).describe());
  }

  @TestMethod
  public describesTheBrokenChainsItFound(): void {
    Assert.isTrue(new ProcessDescendants([], false, 1, 3, true, ["30 under 99, gone or reused", "31 under 30 under 99, gone or reused"]).describe()
      .endsWith("and these processes started after the run under a parent that has gone: 30 under 99, gone or reused; 31 under 30 under 99, gone or reused."));
  }
}
