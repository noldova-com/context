/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { Change, ChangeFeed, ChangeOperation, DataException, type DataRecord } from "@noldova/context.data";

import { SqlQuery } from "../models/sql-query.js";
import { Resources } from "../resources.js";
import type { SqlConnection } from "../models/sql-connection.js";
import type { SqlTransaction } from "../models/sql-transaction.js";

export class SqlChangeFeed extends ChangeFeed<SqlTransaction> {
  private readonly connection: SqlConnection;

  public constructor(connection: SqlConnection) {
    super();

    this.connection = connection;
  }

  protected override async appendCoreAsync(
    entity: string, entityId: string, operation: ChangeOperation, payload: string, transaction: SqlTransaction | undefined): Promise<Change> {
    if (Object.isUndefined(transaction))
      return this.connection.runInTransactionAsync(async t => this.appendInAsync(t, entity, entityId, operation, payload));

    return this.appendInAsync(transaction, entity, entityId, operation, payload);
  }

  protected override async readAfterCoreAsync(sequence: number, limit: number, transaction: SqlTransaction | undefined): Promise<readonly Change[]> {
    const target = transaction ?? this.connection;
    await this.prepareAsync(target);
    return (await target.queryAsync(new SqlQuery(Resources.selectChangesAfter, [sequence, limit]))).map(t => SqlChangeFeed.toChange(t));
  }

  private async appendInAsync(transaction: SqlTransaction, entity: string, entityId: string, operation: ChangeOperation, payload: string): Promise<Change> {
    for (const statement of this.connection.dialect.formatLock(Resources.changesTable))
      await transaction.executeAsync(new SqlQuery(statement));
    await this.prepareAsync(transaction);
    const createdAt = new Date().toISOString();
    const sequence = await transaction.insertAsync(new SqlQuery(Resources.insertChange, [entity, entityId, operation, payload, createdAt]));
    return new Change(sequence, entity, entityId, operation, payload, createdAt);
  }

  private async prepareAsync(target: SqlConnection | SqlTransaction): Promise<void> {
    await target.executeAsync(new SqlQuery(Resources.formatCreateChangesTable(this.connection.dialect.formatIdentityColumnType())));
    await target.executeAsync(new SqlQuery(Resources.createChangesIndex));
  }

  private static toChange(record: DataRecord): Change {
    return new Change(
      record.readInteger(Resources.sequenceColumn),
      record.readString(Resources.entityColumn),
      record.readString(Resources.entityIdColumn),
      SqlChangeFeed.parseOperation(record.readString(Resources.operationColumn)),
      record.readString(Resources.payloadColumn),
      record.readString(Resources.createdAtColumn));
  }

  private static parseOperation(text: string): ChangeOperation {
    const operation = Object.values(ChangeOperation).find(t => t === text);
    if (Object.isUndefined(operation))
      throw new DataException(Resources.unknownOperation);

    return operation;
  }
}
