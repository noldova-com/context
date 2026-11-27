/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MigrationStamp } from "@noldova/context.data.tools/services/migration-stamp.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class MigrationStampTests {
  private static readonly now: Date = new Date(Date.UTC(2026, 0, 2, 3, 4, 5));

  @TestMethod
  public writesTheTimeInUtcWithEveryPartPadded(): void {
    Assert.areEqual("20260102030405", MigrationStamp.next(MigrationStampTests.now, null));
  }

  @TestMethod
  public keepsTheTimeWhenItIsAfterTheLastStamp(): void {
    Assert.areEqual("20260102030405", MigrationStamp.next(MigrationStampTests.now, "20260102030404"));
  }

  @TestMethod
  public takesTheSecondAfterTheLastStampWhenTheTimeIsNotAfterIt(): void {
    Assert.areEqual("20260102030406", MigrationStamp.next(MigrationStampTests.now, "20260102030405"));
    Assert.areEqual("20270101000000", MigrationStamp.next(MigrationStampTests.now, "20261231235959"));
  }
}
