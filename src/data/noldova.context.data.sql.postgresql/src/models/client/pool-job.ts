/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { QueryStatement } from "../query-statement.js";
import type { PostgreSQLConnection } from "./postgresql-connection.js";
import type { Query } from "./query.js";

export class PoolJob {
  public readonly query: Query | null;
  public readonly run: (connection: PostgreSQLConnection) => void;
  public readonly fail: (error: Error) => void;
  public statement: QueryStatement | null = null;
  public lease: boolean = false;
  public plain: boolean = false;
  public typed: boolean = false;
  public exclusive: boolean = false;
  public timer: number | null = null;

  public constructor(query: Query | null, run: (connection: PostgreSQLConnection) => void, fail: (error: Error) => void) {
    this.query = query;
    this.run = run;
    this.fail = fail;
  }
}
