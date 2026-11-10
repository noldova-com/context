/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException, ArgumentOutOfRangeException } from "@noldova/context.exceptions";

import type { ChangeOperation } from "../enums/change-operation.js";
import type { Change } from "../models/change.js";
import { Resources } from "../resources.js";
import type { Transaction } from "../models/transaction.js";

export abstract class ChangeFeed<TTransaction extends Transaction = Transaction> {
  public async appendAsync(entity: string, entityId: string, operation: ChangeOperation, payload: string, transaction?: TTransaction): Promise<Change> {
    ArgumentException.throwIfNullOrWhitespace(entity, Resources.entityParameterName);
    ArgumentException.throwIfNullOrWhitespace(entityId, Resources.entityIdParameterName);

    return this.appendCoreAsync(entity, entityId, operation, payload, transaction);
  }

  public async readAfterAsync(sequence: number, limit: number = Resources.defaultChangeBatch, transaction?: TTransaction): Promise<readonly Change[]> {
    if (!Number.isInteger(sequence) || sequence < 0)
      throw new ArgumentOutOfRangeException(Resources.sequenceParameterName, sequence);
    if (!Number.isInteger(limit) || limit <= 0)
      throw new ArgumentOutOfRangeException(Resources.limitParameterName, limit);

    return this.readAfterCoreAsync(sequence, limit, transaction);
  }

  protected abstract appendCoreAsync(entity: string, entityId: string, operation: ChangeOperation, payload: string, transaction: TTransaction | undefined): Promise<Change>;

  protected abstract readAfterCoreAsync(sequence: number, limit: number, transaction: TTransaction | undefined): Promise<readonly Change[]>;
}
