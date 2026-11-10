/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "../exceptions/data.exception.js";
import { Resources } from "../resources.js";

export abstract class Transaction implements AsyncDisposable {
  private completed: boolean = false;
  private rollbackOnly: boolean = false;

  public get isCompleted(): boolean {
    return this.completed;
  }

  public get isRollbackOnly(): boolean {
    return this.rollbackOnly;
  }

  public async runInTransactionAsync<T>(action: (transaction: this) => Promise<T>): Promise<T> {
    this.throwIfCompleted();
    try {
      return await action(this);
    }
    catch (error) {
      this.rollbackOnly = true;
      throw error;
    }
  }

  public async commitAsync(): Promise<void> {
    this.throwIfCompleted();
    await this.commitCoreAsync();
    this.completed = true;
  }

  public async rollbackAsync(): Promise<void> {
    this.throwIfCompleted();
    await this.rollbackCoreAsync();
    this.completed = true;
  }

  public async [Symbol.asyncDispose](): Promise<void> {
    if (!this.completed)
      await this.rollbackAsync();
  }

  protected abstract commitCoreAsync(): Promise<void>;

  protected abstract rollbackCoreAsync(): Promise<void>;

  protected throwIfCompleted(): void {
    if (this.completed)
      throw new DataException(Resources.transactionCompleted);
  }
}
