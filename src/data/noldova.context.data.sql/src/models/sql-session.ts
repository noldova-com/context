/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DataRecord } from "@noldova/context.data";

import type { SqlQuery } from "./sql-query.js";

export abstract class SqlSession {
  public abstract get isOpen(): boolean;

  public abstract executeAsync(query: SqlQuery): Promise<number>;

  public abstract insertAsync(query: SqlQuery): Promise<number>;

  public abstract queryAsync(query: SqlQuery): Promise<readonly DataRecord[]>;

  public abstract closeAsync(): Promise<void>;
}
