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
    Assert.areEqual("Its one-off listing took 312 ms and held 470 processes, and it shows no process started after " +
      "the run under a parent that has gone.", new ProcessDescendants([], false, 312, 470, [], []).describe());
  }

  @TestMethod
  public describesAWarmListingWithoutTheRunOrStartTimes(): void {
    Assert.areEqual("Its warm listing took 4 ms and held 2 processes, and it gives no start times to find the processes " +
      "started after the run under a parent that has gone.", new ProcessDescendants([21], true, 4, 2, undefined, []).describe());
  }

  @TestMethod
  public describesTheBrokenChainsItFound(): void {
    Assert.isTrue(new ProcessDescendants([], false, 1, 3, ["30 under 99, gone or reused", "31 under 30 under 99, gone or reused"], []).describe()
      .endsWith("and these processes started after the run under a parent that has gone: 30 under 99, gone or reused; 31 under 30 under 99, gone or reused."));
  }

  @TestMethod
  public describesTheListingsBeforeItThatLeftOutTheRun(): void {
    Assert.areEqual("Its warm listing took 3 ms and held 2 processes, and it shows no process started after the run under a parent that has gone. " +
      "Listings before it that left out the run's own process: 2 (warm, 4 ms, 1 listed; one-off, 412 ms, 1 listed).",
    new ProcessDescendants([21], true, 3, 2, [], ["warm, 4 ms, 1 listed", "one-off, 412 ms, 1 listed"]).describe());
  }
}
