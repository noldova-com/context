/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { ExchangeKind } from "../../enums/exchange-kind.js";
import type { WriteOutcome } from "../../enums/write-outcome.js";
import type { Column } from "../column.js";
import type { PreparedStatement } from "../prepared-statement.js";
import type { QueryBatch } from "../query-batch.js";
import type { QueryStatement } from "../query-statement.js";
import { Result } from "../result.js";
import { StatementDescription } from "../statement-description.js";
import type { StatementShape } from "../statement-shape.js";
import type { ConnectionLease } from "../../services/client/connection-lease.js";
import type { CopyBothStream } from "./copy-both-stream.js";
import type { CopyInStream } from "./copy-in-stream.js";
import type { CopyOutStream } from "./copy-out-stream.js";
import type { Deferred } from "./deferred.js";
import type { Query } from "./query.js";

export class Exchange {
  public kind: ExchangeKind;
  public readonly query: Query | null;
  public readonly lease: ConnectionLease | null;
  public write: (exchange: Exchange) => WriteOutcome;
  public statement: QueryStatement | null = null;
  public text: string = "";
  public entry: PreparedStatement | null = null;
  public fresh: PreparedStatement | null = null;
  public previous: PreparedStatement | null = null;
  public parses: string[] = [];
  public values: readonly (string | Uint8Array | null)[] = [];
  public params: readonly number[] | null = null;
  public columns: readonly Column[] | null = null;
  public shaped: readonly Column[] | null = null;
  public reader: readonly Column[] = [];
  public result: Result = new Result();
  public results: Result[] = [];
  public origin: Exchange | null = null;
  public portal: string = "";
  public rows: number = 0;
  public end: boolean = false;
  public failure: Error | null = null;
  public flushing: boolean = false;
  public streaming: boolean = false;
  public open: boolean = false;
  public readonly alone: boolean;
  public describing: boolean = false;
  public learn: boolean = false;
  public batch: QueryBatch | null = null;
  public nosync: boolean = false;
  public aborted: boolean = false;
  public flushed: boolean = false;
  public loose: boolean = false;
  public gate: boolean = false;
  public later: boolean = false;
  public formats: readonly number[] | null = null;
  public verify: boolean = false;
  public synced: boolean = false;
  public bound: boolean = false;
  public suspended: boolean = false;
  public finished: boolean = false;
  public done: boolean = false;
  public ends: boolean = false;
  public epoch: number = 0;
  public retried: boolean = false;
  public original: Error | null = null;
  public error: Error | null = null;
  public own: Error | null = null;
  public cancel: Deferred<void> | null = null;
  public unanswered: number | null = null;
  public silence: number | null = null;
  public completed: boolean = false;
  public describedFor: Query | null = null;
  public stream: CopyInStream | CopyOutStream | CopyBothStream | null = null;
  public copied: boolean = false;
  public wanted: boolean = false;
  public final: ((error?: Error | null) => void) | null = null;
  public resolve: ((shape: StatementShape) => void) | null = null;
  public reject: ((error: unknown) => void) | null = null;
  public cost: number | null = null;
  public last: Promise<unknown> | null = null;
  public awaiting: boolean = false;

  public constructor(kind: ExchangeKind, query: Query | null, lease: ConnectionLease | null, write: (exchange: Exchange) => WriteOutcome) {
    this.kind = kind;
    this.query = query;
    this.lease = lease;
    this.write = write;
    this.alone = query?.alone ?? false;
  }

  public get exclusive(): boolean {
    return this.flushing || this.streaming || this.alone;
  }

  public isHolding(): boolean {
    return this.describing
      || (this.gate && this.learn && Object.isNull(this.error))
      || (!Object.isNull(this.error) && !this.done)
      || (this.flushing && !this.synced)
      || (this.streaming && this.open)
      || (this.alone && !this.done);
  }

  public isNotable(threshold: number): boolean {
    return !Object.isNull(this.cost) && this.cost >= threshold;
  }

  public describe(): StatementDescription {
    const statement = this.statement;
    return new StatementDescription(
      Object.isNull(statement) ? "" : statement.name,
      Object.isNull(statement) ? this.text : statement.text,
      this.params ?? this.entry?.oids ?? [],
      this.columns ?? []);
  }
}
