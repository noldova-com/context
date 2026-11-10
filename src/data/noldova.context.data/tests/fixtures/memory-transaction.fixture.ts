/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { Transaction } from "@noldova/context.data";

export class MemoryTransaction extends Transaction {
  private readonly log: string[];

  public commits: number = 0;
  public rollbacks: number = 0;
  public commitFailure: Error | undefined;
  public rollbackFailure: Error | undefined;

  public constructor(log: string[] = []) {
    super();

    this.log = log;
    this.commitFailure = undefined;
    this.rollbackFailure = undefined;
  }

  public async recordAsync(entry: string): Promise<void> {
    this.throwIfCompleted();
    this.log.push(entry);
  }

  protected override async commitCoreAsync(): Promise<void> {
    this.commits += 1;
    if (!Object.isUndefined(this.commitFailure))
      throw this.commitFailure;
  }

  protected override async rollbackCoreAsync(): Promise<void> {
    this.rollbacks += 1;
    if (!Object.isUndefined(this.rollbackFailure))
      throw this.rollbackFailure;
  }
}
