/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ProcessIdentity } from "@noldova/context.processes";
import { Assert, TestClass, TestingException, TestMethod } from "@noldova/context.testing";
import { RunProcesses } from "@noldova/context.testing/services/execution/run-processes.js";

@TestClass
export class RunProcessesTests {
  @TestMethod
  public keepsTheRunsListedIdentity(): void {
    const identity = new ProcessIdentity(process.pid, 1);

    Assert.areEqual(identity, RunProcesses.requireListed(identity));
  }

  @TestMethod
  public failsNamingTheRunWhenTheListingLeftItOut(): void {
    const error = Assert.throws(() => RunProcesses.requireListed(undefined), TestingException);

    Assert.areEqual(`The process listing left out the run's own process, ${process.pid}, so the processes running under it could not be found.`, error.message);
  }
}
