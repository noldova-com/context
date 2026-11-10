/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "../exceptions/data.exception.js";
import type { DataSource } from "./data-source.js";
import { Resources } from "../resources.js";
import type { Transaction } from "./transaction.js";

export abstract class Connection<TTransaction extends Transaction = Transaction> implements AsyncDisposable {
  private turn: Promise<void> = Promise.resolve();
  private activeTransaction: TTransaction | null = null;

  public readonly dataSource: DataSource;

  protected constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  public abstract get isOpen(): boolean;

  public get isInTransaction(): boolean {
    return this.activeTransaction !== null;
  }

  public async runInTransactionAsync<T>(action: (transaction: TTransaction) => Promise<T>): Promise<T> {
    return this.runExclusiveAsync(async () => this.runTransactionAsync(action));
  }

  public async closeAsync(): Promise<void> {
    await this.runExclusiveAsync(async () => this.closeCoreAsync());
  }

  public async [Symbol.asyncDispose](): Promise<void> {
    await this.closeAsync();
  }

  protected abstract beginTransactionCoreAsync(): Promise<TTransaction>;

  protected abstract closeCoreAsync(): Promise<void>;

  protected async runExclusiveAsync<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.turn.then(operation);
    this.turn = result.then(() => undefined, () => undefined);
    return result;
  }

  protected throwIfClosed(): void {
    if (!this.isOpen)
      throw new DataException(Resources.connectionClosed);
  }

  private async runTransactionAsync<T>(action: (transaction: TTransaction) => Promise<T>): Promise<T> {
    this.throwIfClosed();
    const transaction = await this.beginTransactionCoreAsync();
    this.activeTransaction = transaction;
    try {
      const result = await action(transaction);
      if (transaction.isRollbackOnly)
        throw new DataException(Resources.nestedTransactionFailed);
      await transaction.commitAsync();
      return result;
    }
    catch (error) {
      try {
        await transaction[Symbol.asyncDispose]();
      }
      catch (rollbackError) {
        throw new SuppressedError(rollbackError, error, Resources.transactionRollbackFailed);
      }
      throw error;
    }
    finally {
      this.activeTransaction = null;
    }
  }
}
