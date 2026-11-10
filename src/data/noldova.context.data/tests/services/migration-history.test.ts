/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MigrationHistory } from "@noldova/context.data";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { MemoryMigrationHistory } from "../fixtures/memory-migration-history.fixture.js";

@TestClass
export class MigrationHistoryTests {
  @TestMethod
  public async isImplementedByStoreKinds(): Promise<void> {
    const history = new MemoryMigrationHistory();
    await history.recordAsync("20260908130001_B");
    await history.recordAsync("20260908130000_A");

    Assert.isInstanceOf(history, MigrationHistory);
    Assert.areEqual("20260908130000_A,20260908130001_B", (await history.getAppliedAsync()).join(","));
  }
}
