/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { DataRecord } from "@noldova/context.data";
import { type SqlQuery, SqlSession } from "@noldova/context.data.sql";

export class RecordingSession extends SqlSession {
  private open: boolean = true;
  private nextRowId: number = 1;

  public readonly statements: string[] = [];
  public readonly appliedIds: string[] = [];
  public readonly queryResults: DataRecord[] = [];
  public failingStatement: string | undefined = undefined;
  public appliedOnLock: string | undefined = undefined;
  public locksBeforeApplied: number = 0;
  public closeCount: number = 0;

  public override get isOpen(): boolean {
    return this.open;
  }

  public override async executeAsync(query: SqlQuery): Promise<number> {
    await Promise.resolve();
    if (!Object.isUndefined(this.failingStatement) && query.text.includes(this.failingStatement))
      throw new Error(query.text);

    this.statements.push(query.text);
    if (query.text.startsWith("LOCK") && !Object.isUndefined(this.appliedOnLock) && this.locksBeforeApplied-- === 0)
      this.appliedIds.push(this.appliedOnLock);
    if (query.text.startsWith("INSERT INTO \"__migrations\"") && Object.isString(query.parameters[0]))
      this.appliedIds.push(query.parameters[0]);
    return 1;
  }

  public override async insertAsync(query: SqlQuery): Promise<number> {
    await this.executeAsync(query);
    this.nextRowId += 1;
    return this.nextRowId - 1;
  }

  public override async queryAsync(query: SqlQuery): Promise<readonly DataRecord[]> {
    await Promise.resolve();
    this.statements.push(query.text);
    if (query.text.startsWith("SELECT \"id\" FROM \"__migrations\""))
      return [...this.appliedIds].sort().map(t => new DataRecord(new Map([["id", t]])));

    return [...this.queryResults];
  }

  public override async closeAsync(): Promise<void> {
    await Promise.resolve();
    this.open = false;
    this.closeCount += 1;
  }
}
