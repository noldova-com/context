/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import "@noldova/context.core";
import { DataException, type DataRecord, type DataValue } from "@noldova/context.data";
import { type SqlQuery, SqlSession } from "@noldova/context.data.sql";

import type { PostgreSQLClient } from "./client/postgresql-client.js";
import type { ReservedClient } from "./client/reserved-client.js";
import type { Column } from "./column.js";
import { Result } from "./result.js";
import { Resources } from "../resources.js";
import { ParameterRewriter } from "../services/parameter-rewriter.js";
import { ValueConverter } from "../services/value-converter.js";

export class PostgreSQLSession extends SqlSession {
  private readonly client: PostgreSQLClient;
  private reserved: ReservedClient | null = null;
  private open: boolean = true;

  public constructor(client: PostgreSQLClient) {
    super();

    this.client = client;
  }

  public override get isOpen(): boolean {
    return this.open;
  }

  public override async executeAsync(query: SqlQuery): Promise<number> {
    const [result] = await this.runAsync(query.text, query.parameters);
    return result.count ?? 0;
  }

  public override async insertAsync(query: SqlQuery): Promise<number> {
    await this.runAsync(query.text, query.parameters);
    const [record] = PostgreSQLSession.toRecords(await this.runAsync(Resources.selectLastValue, []));
    return Number(record?.readValue(Resources.lastValueColumn));
  }

  public override async queryAsync(query: SqlQuery): Promise<readonly DataRecord[]> {
    return PostgreSQLSession.toRecords(await this.runAsync(query.text, query.parameters));
  }

  public override async closeAsync(): Promise<void> {
    if (!this.open)
      return;

    this.open = false;
    this.reserved?.release();
    this.reserved = null;
    await this.client.endAsync();
  }

  private async runAsync(text: string, parameters: readonly DataValue[]): Promise<readonly [Result, readonly Column[]]> {
    this.reserved ??= await this.client.reserveAsync();
    const outcome = await this.reserved.query(ParameterRewriter.rewrite(text, parameters.length), parameters.map(t => ValueConverter.write(t)))
      .useParsers(() => null)
      .useValueRows();
    if (!(outcome instanceof Result) || Object.isNull(outcome.columns))
      throw new DataException(Resources.unsupportedOutcome);

    return [outcome, outcome.columns];
  }

  private static toRecords([result, columns]: readonly [Result, readonly Column[]]): readonly DataRecord[] {
    return result.map(row => ValueConverter.readRecord(columns, row));
  }
}
