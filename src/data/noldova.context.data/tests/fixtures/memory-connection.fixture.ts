/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Connection, DataSource } from "@noldova/context.data";

import { MemoryTransaction } from "./memory-transaction.fixture.js";

export class MemoryConnection extends Connection<MemoryTransaction> {
  private open: boolean = true;

  public readonly transactions: MemoryTransaction[] = [];
  public readonly log: string[] = [];
  public closeCount: number = 0;

  public constructor(dataSource: DataSource = new DataSource("memory", ":memory:")) {
    super(dataSource);
  }

  public override get isOpen(): boolean {
    return this.open;
  }

  public async recordAsync(entry: string): Promise<void> {
    await this.runExclusiveAsync(async () => {
      this.throwIfClosed();
      this.log.push(entry);
    });
  }

  protected override async beginTransactionCoreAsync(): Promise<MemoryTransaction> {
    const transaction = new MemoryTransaction(this.log);
    this.transactions.push(transaction);
    return transaction;
  }

  protected override async closeCoreAsync(): Promise<void> {
    this.open = false;
    this.closeCount += 1;
  }
}
