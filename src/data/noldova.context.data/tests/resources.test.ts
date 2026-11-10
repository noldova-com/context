/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException, DataRecord, Migration } from "@noldova/context.data";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { MemoryConnection } from "./fixtures/memory-connection.fixture.js";
import { MemoryTransaction } from "./fixtures/memory-transaction.fixture.js";
import { NotesMigration } from "./fixtures/notes-migration.fixture.js";

@TestClass
export class ResourcesTests {
  @TestMethod
  public async reportsTheCanonicalMessages(): Promise<void> {
    const connection = new MemoryConnection();
    await connection.closeAsync();
    const transaction = new MemoryTransaction();
    await transaction.commitAsync();

    Assert.areEqual("The connection is closed.", (await Assert.throwsAsync(async () => connection.runInTransactionAsync(async () => 1), DataException)).message);
    Assert.areEqual("The transaction has already been committed or rolled back.", (await Assert.throwsAsync(async () => transaction.commitAsync(), DataException)).message);
    Assert.areEqual("The record has no field \"id\".", Assert.throws(() => new DataRecord(new Map()).readValue("id"), DataException).message);
    Assert.areEqual("Migrations are listed once each, in ascending id order.", Assert.throws(() => Migration.validateOrder([new NotesMigration(), new NotesMigration()]), DataException).message);
  }
}
