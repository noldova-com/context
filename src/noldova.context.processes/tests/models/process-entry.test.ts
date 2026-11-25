/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ProcessesException } from "@noldova/context.processes";
import { ProcessEntry } from "@noldova/context.processes/models/process-entry.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class ProcessEntryTests {
  @TestMethod
  public readsEachFieldOfALine(): void {
    const entry = ProcessEntry.parse("200   100 50 Ss 1763806000000");

    Assert.areEqual(200, entry.processId);
    Assert.areEqual(100, entry.parentId);
    Assert.areEqual(50, entry.groupId);
    Assert.isFalse(entry.isZombie);
    Assert.areEqual(1_763_806_000_000, entry.startTime);
    Assert.areEqual(200, entry.identity.processId);
    Assert.areEqual(1_763_806_000_000, entry.identity.startTime);
  }

  @TestMethod
  public readsAZombieByItsState(): void {
    Assert.isTrue(ProcessEntry.parse("200 100 50 Z+ 10").isZombie);
  }

  @TestData("")
  @TestData("200 100 50 S")
  @TestData("200 100 50 S 10 20")
  @TestData("pid 100 50 S 10")
  @TestData("200 100 50 S -10")
  @TestData("200 100 50 S 1.5")
  @TestMethod
  public refusesALineThatIsNotAProcess(line: string): void {
    const error = Assert.throws(() => ProcessEntry.parse(line), ProcessesException);

    Assert.areEqual(`The process lister answered "${line}", which is not a process id, parent id, group id, state and start time.`, error.message);
  }
}
