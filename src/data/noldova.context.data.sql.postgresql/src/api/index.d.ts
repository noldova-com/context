/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ColumnType, SqlDialect } from "@noldova/context.data.sql";

/**
 * How PostgreSQL spells transactions, column types, generated keys, and locks.
 */
export declare class PostgreSQLDialect extends SqlDialect {
  /**
   * `BEGIN`: PostgreSQL's row locks and the advisory lock from `formatLock`
   * serialize the writers, so a transaction needs no write lock when it
   * begins.
   */
  public override formatBeginTransaction(): string;

  /**
   * `TEXT` or `BIGINT`.
   */
  public override formatColumnType(type: ColumnType): string;

  /**
   * `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`, so the database
   * generates every key and refuses one given by the insert.
   */
  public override formatIdentityColumnType(): string;

  /**
   * One statement taking the transaction-scoped advisory lock keyed by the
   * hash of the resource's name, held until the transaction ends.
   */
  public override formatLock(resource: string): readonly string[];
}
