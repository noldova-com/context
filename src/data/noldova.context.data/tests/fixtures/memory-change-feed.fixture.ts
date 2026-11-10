/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Change, ChangeFeed, type ChangeOperation, type Transaction } from "@noldova/context.data";

export class MemoryChangeFeed extends ChangeFeed {
  public readonly changes: Change[] = [];
  public readonly transactions: (Transaction | undefined)[] = [];

  protected override async appendCoreAsync(entity: string, entityId: string, operation: ChangeOperation, payload: string, transaction: Transaction | undefined): Promise<Change> {
    this.transactions.push(transaction);
    const change = new Change(this.changes.length + 1, entity, entityId, operation, payload, new Date().toISOString());
    this.changes.push(change);
    return change;
  }

  protected override async readAfterCoreAsync(sequence: number, limit: number, transaction: Transaction | undefined): Promise<readonly Change[]> {
    this.transactions.push(transaction);
    return this.changes.filter(t => t.sequence > sequence).slice(0, limit);
  }
}
