/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import type { DatabaseSync, SQLOutputValue, StatementSync } from "node:sqlite";

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
    return Number(this.prepare(query.text).run(...query.parameters).changes);
  }

  public override async insertAsync(query: SqlQuery): Promise<number> {
    return Number(this.prepare(query.text).run(...query.parameters).lastInsertRowid);
  }

  public override async queryAsync(query: SqlQuery): Promise<readonly DataRecord[]> {
    return this.prepare(query.text).all(...query.parameters).map(t => SQLiteSession.toRecord(t));
  }

  public override async closeAsync(): Promise<void> {
    if (this.handle.isOpen)
      this.handle.close();
  }

  private prepare(text: string): StatementSync {
    const statement = this.handle.prepare(text);
    if (!SQLiteSession.holdsNoStatement(text.slice(statement.sourceSQL.length)))
      throw new DataException(Resources.multipleStatements);

    return statement;
  }

  private static holdsNoStatement(tail: string): boolean {
    let index = 0;
    while (index < tail.length) {
      if (tail.startsWith(Resources.lineCommentStart, index))
        index = SQLiteSession.skipPast(tail, Resources.lineFeed, index + Resources.lineCommentStart.length);
      else if (tail.startsWith(Resources.blockCommentStart, index))
        index = SQLiteSession.skipPast(tail, Resources.blockCommentEnd, index + Resources.blockCommentStart.length);
      else if (tail.charAt(index) === Resources.statementSeparator || Resources.whitespace.includes(tail.charAt(index)))
        index += 1;
      else
        return false;
    }

    return true;
  }

  private static skipPast(text: string, end: string, from: number): number {
    const found = text.indexOf(end, from);
    return found < 0 ? text.length : found + end.length;
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
