/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import type { DatabaseSync, SQLOutputValue } from "node:sqlite";

import "@noldova/context.core";
import { DataException, DataRecord, type DataValue } from "@noldova/context.data";
import { type SqlQuery, SqlSession } from "@noldova/context.data.sql";

import { Resources } from "../resources.js";

export class SQLiteSession extends SqlSession {
  private readonly handle: DatabaseSync;

  public constructor(handle: DatabaseSync) {
    super();

    this.handle = handle;
  }

  public override get isOpen(): boolean {
    return this.handle.isOpen;
  }

  public override async executeAsync(query: SqlQuery): Promise<number> {
    return Number(this.handle.prepare(query.text).run(...query.parameters).changes);
  }

  public override async insertAsync(query: SqlQuery): Promise<number> {
    return Number(this.handle.prepare(query.text).run(...query.parameters).lastInsertRowid);
  }

  public override async queryAsync(query: SqlQuery): Promise<readonly DataRecord[]> {
    return this.handle.prepare(query.text).all(...query.parameters).map(t => SQLiteSession.toRecord(t));
  }

  public override async closeAsync(): Promise<void> {
    if (this.handle.isOpen)
      this.handle.close();
  }

  private static toRecord(row: Record<string, SQLOutputValue>): DataRecord {
    const values = new Map<string, DataValue>();
    for (const [name, value] of Object.entries(row)) {
      if (!Object.isNull(value) && !Object.isString(value) && !Object.isNumber(value))
        throw new DataException(Resources.unsupportedValue);

      values.set(name, value);
    }

    return new DataRecord(values);
  }
}
