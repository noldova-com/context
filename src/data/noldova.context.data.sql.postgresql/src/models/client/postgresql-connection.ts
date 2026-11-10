/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";
import { Readable } from "node:stream";

import "@noldova/context.core";
import { DataException } from "@noldova/context.data";
import { ExceptionOptions } from "@noldova/context.exceptions";

import { BackendMessage } from "../../enums/backend-message.js";
import { CursorAction } from "../../enums/cursor-action.js";
import { ExchangeKind } from "../../enums/exchange-kind.js";
import { LeaseKind } from "../../enums/lease-kind.js";
import { MessageTarget } from "../../enums/message-target.js";
import { PreparedState } from "../../enums/prepared-state.js";
import { RowMode } from "../../enums/row-mode.js";
import { TransactionStatus } from "../../enums/transaction-status.js";
import { WriteOutcome } from "../../enums/write-outcome.js";
import { BatchException } from "../../exceptions/batch.exception.js";
import { BatchSkippedException } from "../../exceptions/batch-skipped.exception.js";
import { CancelUnansweredException } from "../../exceptions/cancel-unanswered.exception.js";
import { ConnectionClosedException } from "../../exceptions/connection-closed.exception.js";
import { PostgreSQLException } from "../../exceptions/postgresql.exception.js";
import { QueryCanceledException } from "../../exceptions/query-canceled.exception.js";
import { UnsafeTransactionException } from "../../exceptions/unsafe-transaction.exception.js";
import type { BackendKey } from "../backend-key.js";
import { BinaryColumns } from "../binary-columns.js";
import type { BuiltQuery } from "../built-query.js";
import type { ClientOptions } from "../client-options.js";
import { Column } from "../column.js";
import { PreparedStatement } from "../prepared-statement.js";
import { QueryBatch } from "../query-batch.js";
import type { QueryStatement } from "../query-statement.js";
import type { QueryWire } from "../query-wire.js";
import { Result } from "../result.js";
import type { StartedSession } from "../started-session.js";
import { StatementShape } from "../statement-shape.js";
import { Resources } from "../../resources.js";
import type { QueryOutcome } from "../../types/query-outcome.js";
import type { ValueSerializer } from "../../types/value-serializer.js";
import { Backend } from "../../services/protocol/backend.js";
import { FrameReader } from "../../services/protocol/frame.reader.js";
import { Frontend } from "../../services/protocol/frontend.js";
import { ProtocolWriter } from "../../services/protocol/protocol-writer.js";
import type { ClientTimers } from "./client-timers.js";
import type { ConnectionEvents } from "../../services/client/connection-events.js";
import type { ConnectionLease } from "../../services/client/connection-lease.js";
import type { ConnectionSocket } from "./connection-socket.js";
import { CopyBothStream } from "./copy-both-stream.js";
import type { CopyHost } from "../../services/client/copy-host.js";
import { CopyInStream } from "./copy-in-stream.js";
import { CopyOutStream } from "./copy-out-stream.js";
import { Deferred } from "./deferred.js";
import { Exchange } from "./exchange.js";
import type { Query } from "./query.js";
import { RowReader } from "../../services/client/row.reader.js";

export class PostgreSQLConnection implements CopyHost {
  public static readonly slow: number = 100;
  public static readonly notable: number = 5;

  private static readonly limit: number = 1000;
  private static readonly unknownCost: number = 100;
  private static readonly flushLength: number = 65536;
  private static ids: number = 1;

  public readonly id: number;
  public readonly host: string;
  public readonly port: number;
  public readonly backend: BackendKey;
  public readonly parameters: Map<string, string>;
  public readonly prepared: Map<string, PreparedStatement> = new Map();
  public lease: ConnectionLease | null = null;
  public fatal: Error | null = null;
  public uncertain: boolean = false;
  public releasing: boolean = false;
  public retiring: boolean = false;
  public loading: boolean = false;
  public typing: Query | null = null;
  public idleTimer: number | null = null;
  public lifeTimer: number | null = null;
  public idleSince: number = 0;
  public readonly retired: (() => void)[] = [];

  private readonly session: StartedSession;
  private readonly options: ClientOptions;
  private readonly events: ConnectionEvents;
  private readonly socket: ConnectionSocket;
  private readonly timers: ClientTimers;
  private readonly frontend: Frontend = new Frontend();
  private readonly sent: Exchange[] = [];
  private readonly pending: Exchange[] = [];
  private readonly running: Set<Query> = new Set();
  private readonly open: Set<Exchange> = new Set();
  private readonly out: ProtocolWriter = new ProtocolWriter();
  private readonly frames: FrameReader;
  private blocker: Exchange | null = null;
  private stashType: number = 0;
  private stashData: Buffer | null = null;
  private heard: number;
  private rolling: boolean = false;
  private fence: Exchange | null = null;
  private drained: ((error?: Error | null) => void) | null = null;
  private currentStatus: string;
  private flushing: boolean = false;
  private closedError: ConnectionClosedException | null = null;
  private closingPromise: Promise<void> | null = null;
  private onended: (() => void) | null = null;
  private portals: number = 0;
  private epoch: number = 0;
  private headSince: number = 0;
  private notables: number = 0;

  public constructor(session: StartedSession, options: ClientOptions, events: ConnectionEvents) {
    this.session = session;
    this.options = options;
    this.events = events;
    this.socket = session.socket;
    this.timers = options.timers;
    this.id = PostgreSQLConnection.ids;
    PostgreSQLConnection.ids += 1;
    this.host = session.host;
    this.port = session.port;
    this.backend = session.backend;
    this.parameters = new Map(session.parameters);
    this.currentStatus = session.status;
    this.heard = this.timers.readTime();
    this.frames = new FrameReader((type, data, start, end) => this.handleFrame(type, data, start, end), error => {
      this.fatal = error;
      this.socket.destroy();
    }, this.socket.isShared);

    this.socket.onData = data => {
      this.heard = this.timers.readTime();
      this.frames.push(data);
    };
    this.socket.onDrain = () => this.ondrain();
    this.socket.onClose = error => this.onclose(error);
    if (session.rest.length > 0)
      this.frames.push(session.rest);
    this.socket.resume();
  }

  public get status(): string {
    return this.currentStatus;
  }

  public get inflight(): number {
    return this.sent.length + this.pending.length;
  }

  public get exclusive(): boolean {
    return !Object.isNull(this.blocker) && this.blocker.exclusive;
  }

  public get copying(): boolean {
    return !Object.isNull(this.blocker) && this.blocker.streaming && this.blocker.open;
  }

  public get closed(): ConnectionClosedException | null {
    return this.closedError;
  }

  public get closing(): boolean {
    return !Object.isNull(this.closingPromise);
  }

  public get notable(): boolean {
    return this.notables > 0;
  }

  public send(query: Query): void {
    const statement = PostgreSQLConnection.readWire(query).statement;
    const exchange = new Exchange(ExchangeKind.Query, query, this.lease, item => this.writeExtended(item));
    exchange.statement = statement;
    exchange.ends = PostgreSQLConnection.isEnding(statement);
    if (this.options.scheduler)
      this.estimateCost(exchange);
    this.enqueue(exchange);
  }

  public batch(query: Query, parts: readonly Query[]): void {
    const batch = new QueryBatch(query, parts);
    parts.forEach((part, index) => {
      part.redirect(result => this.settleBatchItem(batch, index, null, result), error => this.settleBatchItem(batch, index, error, null));
      if (!Object.isNull(batch.aborted)) {
        this.settleBatchItem(batch, index, new BatchSkippedException(index, batch.aborted), null);
        return;
      }

      const statement = PostgreSQLConnection.readWire(part).statement;
      const exchange = new Exchange(ExchangeKind.Query, part, this.lease, item => this.writeExtended(item));
      exchange.statement = statement;
      exchange.ends = PostgreSQLConnection.isEnding(statement);
      exchange.batch = batch;
      exchange.nosync = index < parts.length - 1;
      if (this.options.scheduler)
        this.estimateCost(exchange);
      this.enqueue(exchange);
    });
  }

  public sendSimple(query: Query, text: string): void {
    const exchange = new Exchange(ExchangeKind.Simple, query, this.lease, item => {
      this.logDebug(text, [], []);
      Frontend.writeQuery(this.out, text);
      item.synced = true;
      return WriteOutcome.Written;
    });
    exchange.text = text;
    exchange.results = [];
    exchange.ends = Resources.endingStatement.test(text);
    exchange.streaming = query.streaming;
    exchange.open = query.streaming;
    if (this.options.scheduler)
      this.estimateCost(exchange);
    this.enqueue(exchange);
  }

  public describeAsync(text: string, oids: readonly number[], query: Query | null): Promise<StatementShape> {
    const deferred = new Deferred<StatementShape>();
    const exchange = new Exchange(ExchangeKind.Describe, null, this.lease, item => {
      Frontend.writeParse(this.out, "", text, oids);
      Frontend.writeDescribe(this.out, MessageTarget.Statement, "");
      this.sync(item);
      return WriteOutcome.Written;
    });
    exchange.describedFor = query;
    exchange.resolve = shape => deferred.resolve(shape);
    exchange.reject = error => deferred.reject(error);
    this.enqueue(exchange);
    return deferred.promise;
  }

  public failLocally(query: Query, error: Error): void {
    this.enqueue(new Exchange(ExchangeKind.Query, query, this.lease, () => {
      throw error;
    }));
  }

  public cancelAsync(query: Query): Promise<void> {
    if (!Object.isNull(query.parts))
      return this.cancelBatchAsync(query);

    const head = this.sent[0];
    if (!Object.isNull(this.stashData) && !Object.isUndefined(head) && head.query === query) {
      head.own = new QueryCanceledException();
      this.go();
      return Promise.resolve();
    }

    if (this.running.has(query) || (!Object.isUndefined(head) && head.query === query && head.awaiting)) {
      query.aborted = new QueryCanceledException();
      return Promise.resolve();
    }

    const index = this.pending.findIndex(item => item.query === query || item.describedFor === query);
    const waiting = this.pending[index];
    if (!Object.isUndefined(waiting)) {
      this.pending.splice(index, 1);
      if (waiting === this.fence)
        this.fence = null;
      if (waiting.isNotable(PostgreSQLConnection.notable))
        this.notables -= 1;
      this.settleError(waiting, new QueryCanceledException());
      this.release();
      return Promise.resolve();
    }

    const exchange = this.sent.find(item => item.query === query || item.describedFor === query);
    if (Object.isUndefined(exchange))
      return Promise.resolve();

    if (exchange === head && exchange.completed) {
      this.expect(exchange);
      return Promise.resolve();
    }

    if (exchange === head && (query.active || !Object.isNull(exchange.describedFor)))
      return this.cancelExchangeAsync(exchange);

    this.watchSilence(exchange);
    exchange.cancel = new Deferred<void>();
    return exchange.cancel.promise;
  }

  public closeAsync(): Promise<void> {
    if (!Object.isNull(this.closingPromise))
      return this.closingPromise;

    this.closingPromise = new Promise<void>(resolve => {
      this.onended = (): void => resolve();
    });
    if (this.isIdle())
      this.terminate();
    return this.closingPromise;
  }

  public destroy(error: Error | null = null): void {
    this.closingPromise ??= Promise.resolve();
    this.socket.destroy(error);
  }

  public go(): void {
    const data = this.stashData;
    if (Object.isNull(data))
      return;

    this.dispatch(this.stashType, data, 0, data.length);
    this.stashData = null;
    this.frames.resume();
  }

  public ref(): void {
    this.socket.ref();
  }

  public unref(): void {
    this.socket.unref();
  }

  public computeBacklog(time: number): number {
    let wait = 0;
    this.sent.forEach((item, index) => {
      const cost = item.cost ?? 0;
      if (index === 0) {
        const elapsed = time - this.headSince;
        wait += elapsed < cost ? cost - elapsed : elapsed;
      }
      else
        wait += cost;
    });
    for (const item of this.pending)
      wait += item.cost ?? 0;

    return wait;
  }

  public isHeavy(): boolean {
    return this.sent.some(item => item.isNotable(PostgreSQLConnection.slow)) || this.pending.some(item => item.isNotable(PostgreSQLConnection.slow));
  }

  public writeCopyData(chunk: string | Uint8Array, callback: (error?: Error | null) => void): void {
    Frontend.writeCopyData(this.out, chunk);
    if (this.flush())
      callback();
    else
      this.drained = callback;
  }

  public finishCopy(exchange: Exchange, callback: (error?: Error | null) => void): void {
    Frontend.writeCopyDone(this.out);
    exchange.copied = true;
    exchange.open = false;
    exchange.final = callback;
    this.schedule(true);
    this.refresh();
  }

  public failCopy(exchange: Exchange, error: Error | null): void {
    exchange.stream = null;
    if (exchange.copied || !Object.isNull(this.closedError) || !Object.isNull(exchange.error))
      return;

    Frontend.writeCopyFail(this.out, Object.isNull(error) ? Resources.copyStreamDestroyed : String(error));
    exchange.copied = true;
    exchange.open = false;
    this.schedule(true);
    this.refresh();
  }

  public readCopy(exchange: Exchange): void {
    exchange.wanted = true;
    if (!this.frames.isPaused)
      return;

    this.frames.resume();
    if (!this.frames.isPaused)
      this.socket.resume();
  }

  public abandonCopy(exchange: Exchange): void {
    if (Object.isNull(exchange.stream))
      return;

    exchange.stream = null;
    if (!this.frames.isPaused)
      return;

    this.frames.resume();
    if (!this.frames.isPaused)
      this.socket.resume();
  }

  private ondrain(): void {
    const drained = this.drained;
    this.drained = null;
    drained?.();
  }

  private schedule(now: boolean = false): boolean {
    if (now || this.out.length >= PostgreSQLConnection.flushLength)
      return this.flush();

    if (!this.flushing) {
      this.flushing = true;
      this.timers.nextTick(() => this.flush());
    }
    return true;
  }

  private flush(): boolean {
    this.flushing = false;
    if (!Object.isNull(this.closedError)) {
      this.out.take();
      return true;
    }

    return this.out.length > 0 ? this.socket.write(this.out.take()) : true;
  }

  private refresh(): void {
    if (!Object.isNull(this.blocker) && !this.blocker.isHolding())
      this.blocker = null;
    this.release();
  }

  private enqueue(exchange: Exchange): void {
    if (!Object.isNull(this.closedError)) {
      this.settleError(exchange, this.closedError);
      return;
    }

    if (!Object.isNull(this.blocker) && this.blocker.streaming && this.blocker.open) {
      this.settleError(exchange, new DataException(Resources.copyInProgress));
      return;
    }

    if (!Object.isNull(exchange.query))
      exchange.query.state = this.backend;
    if (!Object.isNull(this.fence))
      this.pending.splice(this.pending.indexOf(this.fence), 0, exchange);
    else if (exchange.ends && this.open.size > 0) {
      this.fence = exchange;
      this.pending.push(exchange);
    }
    else if (!Object.isNull(this.blocker) || this.pending.length > 0)
      this.pending.push(exchange);
    else {
      this.write(exchange);
      this.schedule();
      return;
    }

    this.release();
  }

  private release(): void {
    for (let next = this.pending[0]; Object.isNull(this.blocker) && !Object.isUndefined(next) && next !== this.fence; next = this.pending[0]) {
      this.pending.shift();
      this.write(next);
    }
    this.schedule();
  }

  private write(exchange: Exchange): void {
    const mark = this.out.length;
    let outcome: WriteOutcome;
    try {
      outcome = exchange.write(exchange);
    }
    catch (error) {
      exchange.own = PostgreSQLConnection.toError(error);
      outcome = WriteOutcome.Skipped;
    }

    if (outcome === WriteOutcome.Held) {
      this.out.truncate(mark);
      exchange.loose = false;
      const blocker = this.sent.find(item => item.gate && item.isHolding());
      if (!Object.isUndefined(blocker)) {
        this.blocker = blocker;
        if (blocker.nosync && !blocker.flushed) {
          blocker.flushed = true;
          Frontend.writeFlush(this.out);
          this.schedule();
        }
      }
      this.pending.unshift(exchange);
      return;
    }

    if (outcome === WriteOutcome.Skipped) {
      this.out.truncate(mark);
      exchange.fresh = null;
      exchange.parses = [];
      exchange.portal = "";
      exchange.describing = false;
      exchange.synced = false;
      exchange.flushing = false;
      exchange.open = false;
      if (!Object.isNull(exchange.batch)) {
        exchange.entry = null;
        Frontend.writeParse(this.out, "", Resources.refusedQuery);
        exchange.parses = [""];
        this.abort(exchange);
      }
      else if (Object.isNull(exchange.own) || exchange.kind === ExchangeKind.Step || Object.isNull(this.lease)) {
        exchange.kind = ExchangeKind.Local;
        if (exchange.isNotable(PostgreSQLConnection.notable))
          this.notables -= 1;
        exchange.cost = null;
        if (this.sent.length === 0)
          queueMicrotask(() => this.settle(exchange));
        else
          this.sent.push(exchange);
        return;
      }
      else {
        exchange.kind = ExchangeKind.Simple;
        exchange.text = Resources.refusedQuery;
        exchange.results = [];
        exchange.entry = null;
        this.sync(exchange, true);
      }
    }

    if (!Object.isNull(exchange.fresh))
      this.register(exchange.fresh);
    if (exchange.portal.length > 0 && exchange.kind === ExchangeKind.Query)
      this.open.add(exchange);
    if (!Object.isNull(exchange.query))
      exchange.query.active = this.sent.length === 0;
    if (exchange.ends)
      this.epoch += 1;
    exchange.epoch = this.epoch;
    if (this.options.scheduler && this.sent.length === 0)
      this.headSince = this.timers.readTime();
    this.sent.push(exchange);
    if (exchange.isHolding())
      this.blocker = exchange;
  }

  private sync(exchange: Exchange, refuse: boolean = false): void {
    if (exchange.synced)
      return;

    exchange.synced = true;
    if (refuse)
      Frontend.writeQuery(this.out, Resources.refusedQuery);
    else
      Frontend.writeSync(this.out);
    this.schedule();
  }

  private register(entry: PreparedStatement): void {
    this.prepared.delete(entry.name);
    this.prepared.set(entry.name, entry);
    if (!Object.isNull(entry.owner)) {
      entry.owner.entry = entry;
      entry.owner.fresh = null;
    }
    if (this.prepared.size <= PostgreSQLConnection.limit)
      return;

    for (const [name, prepared] of this.prepared) {
      if (prepared.state !== PreparedState.Parsing) {
        this.prepared.delete(name);
        Frontend.writeClose(this.out, MessageTarget.Statement, name);
        return;
      }
    }
  }

  private drop(entry: PreparedStatement): void {
    if (this.prepared.get(entry.name) === entry)
      this.prepared.delete(entry.name);
  }

  private settleBatchItem(batch: QueryBatch, index: number, error: Error | null, result: QueryOutcome): void {
    if (batch.settled[index] === true)
      return;

    batch.settled[index] = true;
    batch.left -= 1;
    if (!Object.isNull(error)) {
      if (Object.isNull(batch.error) || (index < batch.index && !(error instanceof BatchSkippedException))) {
        batch.error = error;
        batch.index = index;
      }
    }
    else
      batch.results[index] = result;

    if (batch.left > 0)
      return;

    const failure = batch.error;
    if (!Object.isNull(failure)) {
      batch.parts.forEach((part, partIndex) => {
        part.fail(partIndex === batch.index ? failure : new BatchSkippedException(batch.index, failure));
        part.promise.catch(() => undefined);
      });
      batch.query.reject(new BatchException(batch.index, failure));
      return;
    }

    batch.parts.forEach((part, partIndex) => {
      const result = batch.results[partIndex];
      if (!Object.isUndefined(result))
        part.complete(result);
    });
    batch.query.resolve(batch.results);
  }

  private completeExchange(exchange: Exchange): void {
    this.sent.shift();
    if (this.options.scheduler)
      this.recordTiming(exchange);
    exchange.done = true;
    exchange.open = false;
    if (this.blocker === exchange)
      this.blocker = null;
    this.settle(exchange);
    this.activateHead();
    this.release();
  }

  private abort(exchange: Exchange): void {
    const batch = exchange.batch;
    if (exchange.aborted || Object.isNull(batch))
      return;

    exchange.aborted = true;
    const error = exchange.own ?? exchange.error;
    batch.aborted = error;
    let synced = !exchange.nosync && exchange.synced;
    const at = this.sent.indexOf(exchange);
    for (let index = at === -1 ? this.sent.length : at + 1; index < this.sent.length;) {
      const item = this.sent[index];
      if (!Object.isUndefined(item) && item.batch === batch) {
        this.sent.splice(index, 1);
        synced ||= !item.nosync && item.synced;
        this.dropFromBatch(item, batch, error);
        if (this.blocker === item)
          this.blocker = null;
      }
      else
        index += 1;
    }

    for (let index = 0; index < this.pending.length;) {
      const item = this.pending[index];
      if (!Object.isUndefined(item) && item.batch === batch) {
        this.pending.splice(index, 1);
        this.dropFromBatch(item, batch, error);
      }
      else
        index += 1;
    }

    if (!synced)
      Frontend.writeSync(this.out);
    exchange.nosync = false;
    exchange.synced = true;
    this.schedule();
  }

  private dropFromBatch(item: Exchange, batch: QueryBatch, error: Error | null): void {
    if (!Object.isNull(item.entry) && item.entry.owner === item && item.entry.state === PreparedState.Parsing)
      item.entry.state = PreparedState.Stale;
    item.done = true;
    if (item.isNotable(PostgreSQLConnection.notable))
      this.notables -= 1;
    this.settleError(item, new BatchSkippedException(batch.parts.findIndex(part => part === item.query), error));
  }

  private estimateCost(exchange: Exchange): void {
    const query = exchange.query;
    if (!Object.isNull(query) && !Object.isNull(query.cost) && Object.isNull(query.cursorFn) && !query.streaming)
      exchange.cost = query.cost.estimate ?? PostgreSQLConnection.unknownCost;
    if (exchange.isNotable(PostgreSQLConnection.notable))
      this.notables += 1;
  }

  private recordTiming(exchange: Exchange): void {
    const time = this.timers.readTime();
    if (!Object.isNull(exchange.cost)) {
      if (exchange.isNotable(PostgreSQLConnection.notable))
        this.notables -= 1;
      const sample = time - this.headSince;
      const cost = exchange.query?.cost;
      if (!Object.isNullOrUndefined(cost))
        cost.estimate = Object.isNull(cost.estimate) || sample > cost.estimate ? sample : cost.estimate + (sample - cost.estimate) * 0.1;
      this.events.onTimed(sample, time);
    }

    this.headSince = time;
  }

  private writeExtended(exchange: Exchange): WriteOutcome {
    const query = PostgreSQLConnection.queryOf(exchange);
    const wire = PostgreSQLConnection.readWire(query);
    const built = wire.built;
    const statement = wire.statement;
    const name = statement.name;
    const current = name.length > 0 ? this.prepared.get(name) ?? null : null;

    if (!Object.isNull(query.cursorFn)) {
      exchange.rows = query.cursorRows;
      exchange.portal = this.isInTransaction() ? Resources.portalPrefix + String(this.portals++) : "";
      exchange.flushing = exchange.portal.length === 0;
    }

    exchange.streaming = query.streaming;
    exchange.open = query.streaming;

    if (!Object.isNull(current) && current.state === PreparedState.Parsing && Object.isNull(current.oids) && !Object.isNull(current.owner)
      && Object.isNull(current.owner.error)) {
      current.owner.gate = true;
      return WriteOutcome.Held;
    }

    if (!Object.isNull(current) && !Object.isNull(current.oids) && current !== exchange.previous && PostgreSQLConnection.isUsable(current, statement)) {
      const binary = query.rowMode === RowMode.Raw || !Object.isNull(query.ownParsers) ? null : this.readBinaryColumns(current);
      exchange.entry = current;
      exchange.columns = Object.isNull(binary) ? current.columns : binary.columns;
      exchange.formats = Object.isNull(binary) ? null : binary.formats;
      exchange.values = this.serialize(current.oids, built, current);
      this.run(exchange, name);
      return WriteOutcome.Written;
    }

    if (exchange.retried) {
      exchange.verify = true;
      Frontend.writeParse(this.out, "", statement.text, built.oids);
      Frontend.writeDescribe(this.out, MessageTarget.Statement, "");
      Frontend.writeFlush(this.out);
      exchange.describing = true;
      return WriteOutcome.Written;
    }

    const typed = !PostgreSQLConnection.hasInferredTypes(built);
    if (name.length > 0)
      exchange.fresh = new PreparedStatement(name, exchange, typed ? built.oids : null);
    if (!Object.isNull(current))
      Frontend.writeClose(this.out, MessageTarget.Statement, name);
    this.parse(exchange, name, statement.text, built.oids);
    Frontend.writeDescribe(this.out, MessageTarget.Statement, name);

    if (!typed && !this.isLoose(exchange, built)) {
      Frontend.writeFlush(this.out);
      exchange.describing = true;
      return WriteOutcome.Written;
    }

    exchange.learn = true;
    exchange.values = typed ? this.serialize(built.oids, built, exchange.fresh) : this.formatUntypedValues(built);
    this.run(exchange, name);
    return WriteOutcome.Written;
  }

  private readBinaryColumns(entry: PreparedStatement): BinaryColumns | null {
    const columns = entry.columns;
    if (Object.isNull(columns) || entry.binaryOf === columns)
      return entry.binary;

    const formats: number[] = [];
    let binary: Column[] | null = null;
    columns.forEach((column, index) => {
      const decode = this.events.findBinaryDecoder(column.type);
      formats.push(Object.isNull(decode) ? 0 : 1);
      if (!Object.isNull(decode)) {
        binary ??= [...columns];
        binary[index] = column.withDecoder(decode);
      }
    });

    entry.binaryOf = columns;
    entry.binary = Object.isNull(binary) ? null : new BinaryColumns(binary, formats);
    return entry.binary;
  }

  private isLoose(exchange: Exchange, built: BuiltQuery): boolean {
    if (!this.events.plain || !Object.isNull(PostgreSQLConnection.queryOf(exchange).cursorFn) || exchange.streaming)
      return false;

    const tight = built.oids.some((oid, index) => {
      const value = built.values[index];
      return !oid && !Object.isNull(value) && !(Object.isNumber(value) && Number.isFinite(value));
    });
    if (tight)
      return false;

    exchange.loose = true;
    return true;
  }

  private formatUntypedValues(built: BuiltQuery): (string | Uint8Array | null)[] {
    return built.values.map((value, index) => {
      if (Object.isNull(value))
        return null;

      const oid = built.oids[index] ?? 0;
      return oid ? this.events.findSerializer(oid)(value) : String(value);
    });
  }

  private parse(exchange: Exchange, name: string, text: string, oids: readonly number[]): void {
    Frontend.writeParse(this.out, name, text, oids);
    exchange.parses.push(name);
  }

  private run(exchange: Exchange, name: string): void {
    const mark = this.out.length;
    try {
      if (exchange.nosync) {
        Frontend.writeBind(this.out, exchange.portal, name, exchange.values, [], exchange.formats ?? []);
        Frontend.writeExecute(this.out, exchange.portal, exchange.rows);
      }
      else
        Frontend.writeRun(this.out, exchange.portal, name, exchange.values, exchange.rows, exchange.flushing, exchange.formats);
    }
    catch (error) {
      this.out.truncate(mark);
      throw error;
    }

    if (!exchange.flushing)
      exchange.synced = true;
    const oids = !Object.isNull(exchange.entry)
      ? exchange.entry.oids
      : exchange.params ?? (exchange.loose ? null : PostgreSQLConnection.readWire(PostgreSQLConnection.queryOf(exchange)).built.oids);
    if (Object.isNull(oids))
      exchange.later = true;
    else
      this.logDebug(PostgreSQLConnection.readStatement(exchange).text, exchange.values, oids);
  }

  private logLateExchange(exchange: Exchange, oids: readonly number[]): void {
    if (!exchange.later)
      return;

    exchange.later = false;
    this.logDebug(PostgreSQLConnection.readStatement(exchange).text, exchange.values, oids);
  }

  private serialize(oids: readonly number[], built: BuiltQuery, cache: PreparedStatement | null): (string | Uint8Array | null)[] {
    const serializers: readonly ValueSerializer[] = cache?.serializers ?? oids.map(oid => this.events.findSerializer(oid));
    if (!Object.isNull(cache))
      cache.serializers = serializers;

    return built.values.map((value, index) => {
      if (Object.isNull(value))
        return null;

      const serializer = serializers[index];
      if (Object.isUndefined(serializer))
        throw new DataException(Resources.formatParameterCount(oids.length, built.values.length));

      return serializer(value);
    });
  }

  private isInTransaction(): boolean {
    return this.lease?.kind === LeaseKind.Transaction;
  }

  private handleDescription(exchange: Exchange, columns: readonly Column[]): void {
    exchange.describing = false;
    const wire = PostgreSQLConnection.readWire(PostgreSQLConnection.queryOf(exchange));
    const built = wire.built;
    const statement = wire.statement;
    const params = exchange.params ?? [];

    try {
      if (exchange.verify) {
        const previous = exchange.previous;
        if (!Object.isNull(previous) && PostgreSQLConnection.isSameShape(previous, params, columns)) {
          if (!Object.isNull(exchange.original)) {
            exchange.own = exchange.original;
            this.sync(exchange);
            return;
          }
        }
        else if (!Object.isNull(previous)) {
          this.markStale(previous);
          statement.version += 1;
        }
        exchange.values = this.serialize(params, built, null);
        this.run(exchange, "");
        return;
      }

      const entry = exchange.entry;
      if (!Object.isNull(entry)) {
        entry.oids = params;
        entry.columns = columns;
        PostgreSQLConnection.recordShape(entry, statement, columns);
      }
      exchange.values = this.serialize(params, built, entry);
      this.run(exchange, statement.name);
    }
    catch (error) {
      exchange.own = PostgreSQLConnection.toError(error);
      if (!Object.isNull(exchange.batch)) {
        Frontend.writeParse(this.out, "", Resources.refusedQuery);
        exchange.parses.push("");
        this.abort(exchange);
      }
      else
        this.sync(exchange, !Object.isNull(this.lease));
    }
  }

  private turn(exchange: Exchange, cancel: Deferred<void>): void {
    if (!Object.isNull(exchange.silence)) {
      this.timers.clearTimeout(exchange.silence);
      exchange.silence = null;
    }

    const go = (): void => {
      exchange.silence = null;
      if (!Object.isNull(this.closedError) || exchange.done || this.sent[0] !== exchange) {
        cancel.resolve();
        return;
      }

      if (exchange.completed) {
        this.expect(exchange);
        cancel.resolve();
        return;
      }

      this.cancelExchangeAsync(exchange).then(() => cancel.resolve(), (error: unknown) => cancel.reject(error));
    };

    if (exchange.query?.timedOut === true && this.options.queryTimeout > 0)
      exchange.silence = this.timers.setTimeout(go, this.options.queryTimeout * 1000);
    else
      this.timers.nextTick(go);
  }

  private watchSilence(exchange: Exchange): void {
    if (!this.options.cancelTimeout || !Object.isNull(exchange.silence))
      return;

    const milliseconds = this.options.cancelTimeout * 1000;
    const check = (): void => {
      exchange.silence = null;
      const query = exchange.query ?? exchange.describedFor;
      if (!Object.isNull(this.closedError) || exchange.done || Object.isNull(query) || query.settled)
        return;

      const idle = this.timers.readTime() - this.heard;
      if (idle >= milliseconds)
        this.destroy(new CancelUnansweredException(this.options.cancelTimeout, true));
      else
        exchange.silence = this.timers.setTimeout(check, milliseconds - idle);
    };

    exchange.silence = this.timers.setTimeout(check, milliseconds);
  }

  private cancelExchangeAsync(exchange: Exchange): Promise<void> {
    this.expect(exchange);
    const cancel = this.session.cancelAsync(this.events.cancels);
    this.events.onCancelling(cancel);
    return cancel;
  }

  private expect(exchange: Exchange): void {
    if (!this.options.cancelTimeout || !Object.isNull(exchange.unanswered))
      return;

    exchange.unanswered = this.timers.setTimeout(() => this.handleUnanswered(exchange), this.options.cancelTimeout * 1000);
    exchange.batch?.query.promise.then(() => this.clearUnanswered(exchange), () => this.clearUnanswered(exchange));
  }

  private clearUnanswered(exchange: Exchange): void {
    if (Object.isNull(exchange.unanswered))
      return;

    this.timers.clearTimeout(exchange.unanswered);
    exchange.unanswered = null;
  }

  private handleUnanswered(exchange: Exchange): void {
    exchange.unanswered = null;
    const query = Object.isNull(exchange.batch) ? exchange.query ?? exchange.describedFor : exchange.batch.query;
    if (!Object.isNull(this.closedError) || (exchange.done && Object.isNull(exchange.batch)) || Object.isNull(query) || query.settled)
      return;

    this.destroy(new CancelUnansweredException(this.options.cancelTimeout, false));
  }

  private markAnswered(exchange: Exchange): void {
    if (!Object.isNull(exchange.silence)) {
      this.timers.clearTimeout(exchange.silence);
      exchange.silence = null;
    }
    if (Object.isNull(exchange.batch) || exchange.batch.query.settled)
      this.clearUnanswered(exchange);
  }

  private cancelBatchAsync(query: Query): Promise<void> {
    const exchange = this.sent.find(item => item.batch?.query === query);
    if (!Object.isUndefined(exchange)) {
      if (exchange === this.sent[0])
        return this.cancelExchangeAsync(exchange);

      exchange.cancel = new Deferred<void>();
      return exchange.cancel.promise;
    }

    const first = this.pending.find(item => item.batch?.query === query);
    if (!Object.isUndefined(first)) {
      const own = new QueryCanceledException();
      first.own = own;
      first.write = (): WriteOutcome => {
        throw own;
      };
    }
    return Promise.resolve();
  }

  private isIdle(): boolean {
    return this.sent.length === 0 && this.pending.length === 0;
  }

  private terminate(): void {
    if (!Object.isNull(this.closedError)) {
      this.onended?.();
      return;
    }

    this.flush();
    this.socket.end(this.frontend.terminate());
  }

  private onclose(error: Error | null): void {
    this.out.take();
    this.blocker = null;
    this.fence = null;
    this.notables = 0;
    const head = this.sent[0];
    const failed = head?.error instanceof PostgreSQLException && head.error.severity === Resources.fatalSeverity ? head.error : null;
    const fatal = this.fatal ?? failed;
    this.uncertain = !Object.isNull(fatal) && !Object.isUndefined(head) && head.ends;
    const closed = new ConnectionClosedException(this.closing, this.host, this.port, fatal ?? error);
    this.closedError = closed;
    for (const item of [...this.sent, ...this.pending])
      item.cancel?.resolve();
    for (const item of this.sent.splice(0)) {
      item.stream?.destroy(closed);
      if (!Object.isNull(item.own))
        this.settle(item);
      else
        this.settleError(item, failed ?? closed);
    }
    for (const item of this.pending.splice(0)) {
      if (!Object.isNull(item.own))
        this.settle(item);
      else
        this.settleError(item, closed);
    }
    for (const query of this.running)
      if (!query.settled)
        query.reject(closed);
    this.running.clear();
    this.open.clear();
    this.onended?.();
    this.events.onClose(this, closed);
  }

  private settleError(exchange: Exchange, error: Error): void {
    this.markAnswered(exchange);
    if (exchange.kind === ExchangeKind.Describe)
      exchange.reject?.(error);
    else if (!Object.isNull(exchange.query) && !exchange.query.settled)
      exchange.query.reject(error);
  }

  private logDebug(text: string, values: readonly (string | Uint8Array | null)[], oids: readonly number[]): void {
    const debug = this.options.debug;
    if (!Object.isBoolean(debug))
      debug(this.id, text, values, oids);
  }

  private handleFrame(type: number, data: Buffer, start: number, end: number): void {
    if (!this.events.typed && Object.isNull(this.stashData) && (type === BackendMessage.RowDescription || type === BackendMessage.ParameterDescription)
      && this.events.hasUnknownTypes(type === BackendMessage.RowDescription ? Backend.readColumnTypes(data, start) : Backend.readParameterDescription(data, start))) {
      this.stashType = type;
      this.stashData = Buffer.from(data.subarray(start, end));
      this.frames.pause();
      this.events.requestTypes(this);
      return;
    }

    this.dispatch(type, data, start, end);
  }

  private dispatch(type: number, data: Buffer, start: number, end: number): void {
    try {
      this.handleMessage(type, data, start, end);
    }
    catch (error) {
      const head = this.sent[0];
      if (Object.isUndefined(head))
        this.destroy(PostgreSQLConnection.toError(error));
      else
        this.fail(head, PostgreSQLConnection.toError(error));
    }

    if (!Object.isNull(this.blocker) && !this.blocker.isHolding()) {
      this.blocker = null;
      this.release();
    }
    if (this.out.length > 0)
      this.schedule();
  }

  private handleMessage(type: number, data: Buffer, start: number, end: number): void {
    switch (type) {
      case BackendMessage.DataRow:
        this.handleDataRow(data, start);
        break;
      case BackendMessage.CopyData:
        this.copyData(data, start, end);
        break;
      case BackendMessage.ReadyForQuery:
        this.handleReadyForQuery(data, start);
        break;
      case BackendMessage.CommandComplete:
        this.handleCommandComplete(data, start, end);
        break;
      case BackendMessage.BindComplete:
        this.bindComplete();
        break;
      case BackendMessage.ParseComplete:
        this.parseComplete();
        break;
      case BackendMessage.ParameterDescription:
        this.handleParameterDescription(data, start);
        break;
      case BackendMessage.RowDescription:
        this.receiveColumns(this.peekHead(), Backend.readColumns(data, start, (name, table, number, oid) => this.createColumn(name, table, number, oid)));
        break;
      case BackendMessage.NoData:
        this.receiveColumns(this.peekHead(), []);
        break;
      case BackendMessage.ErrorResponse:
        this.handleErrorResponse(data, start, end);
        break;
      case BackendMessage.PortalSuspended:
        this.handlePortalSuspended();
        break;
      case BackendMessage.EmptyQueryResponse:
        this.handleEmptyQueryResponse();
        break;
      case BackendMessage.NotificationResponse:
        this.handleNotificationResponse(data, start);
        break;
      case BackendMessage.NoticeResponse:
        this.handleNoticeResponse(data, start, end);
        break;
      case BackendMessage.ParameterStatus:
        this.handleParameterStatus(data, start);
        break;
      case BackendMessage.CopyInResponse:
        this.copyInResponse();
        break;
      case BackendMessage.CopyOutResponse:
        this.copyOutResponse();
        break;
      case BackendMessage.CopyBothResponse:
        this.copyBothResponse();
        break;
      case BackendMessage.CopyDone:
        this.copyDone();
        break;
      case BackendMessage.FunctionCallResponse:
      case BackendMessage.NegotiateProtocolVersion:
        this.rejectUnsupported(String(BackendMessage[type]));
        break;
      default:
        break;
    }
  }

  private fail(exchange: Exchange, error: Error): void {
    exchange.error ??= error;
    exchange.describing = false;
    exchange.open = false;
    if (Object.isNull(exchange.batch))
      this.sync(exchange);
    else
      this.abort(exchange);
  }

  private rejectUnsupported(name: string): void {
    const head = this.sent[0];
    if (!Object.isUndefined(head))
      this.fail(head, new DataException(Resources.formatMessageNotSupported(name)));
  }

  private parseComplete(): void {
    const exchange = this.peekHead();
    const name = exchange.parses.shift();
    const entry = exchange.entry;
    if (!Object.isUndefined(name) && name.length > 0 && !Object.isNull(entry) && entry.name === name && entry.owner === exchange
      && entry.state === PreparedState.Parsing)
      entry.state = PreparedState.Ready;
  }

  private bindComplete(): void {
    const exchange = this.peekHead();
    exchange.bound = true;
    if (Object.isNull(exchange.columns) && !Object.isNull(exchange.entry)) {
      exchange.columns = exchange.entry.columns;
      exchange.result.columns = exchange.columns;
    }
  }

  private handleParameterDescription(data: Buffer, start: number): void {
    const exchange = this.peekHead();
    const params = Backend.readParameterDescription(data, start);
    exchange.params = params;
    const entry = exchange.entry;
    if (exchange.loose && !Object.isNull(entry) && entry.owner === exchange && Object.isNull(entry.oids))
      entry.oids = params;
    this.logLateExchange(exchange, params);
  }

  private receiveColumns(exchange: Exchange, columns: readonly Column[]): void {
    exchange.columns = columns;
    exchange.result.columns = columns;
    if (exchange.learn) {
      exchange.learn = false;
      const entry = exchange.entry;
      if (!Object.isNull(entry) && entry.owner === exchange) {
        entry.columns = columns;
        PostgreSQLConnection.recordShape(entry, PostgreSQLConnection.readStatement(exchange), columns);
      }
    }
    if (exchange.describing)
      this.handleDescription(exchange, columns);
  }

  private createColumn(name: string, table: number, number: number, type: number): Column {
    const parser = this.events.findParser(type);
    const columnFrom = this.options.transform.columnFrom;
    return new Column(Object.isNull(columnFrom) ? name : columnFrom(name), parser, this.events.findDecoder(type, parser), table, number, type);
  }

  private handleDataRow(data: Buffer, start: number): void {
    const exchange = this.peekHead();
    const query = PostgreSQLConnection.queryOf(exchange);
    const mode = query.rowMode;
    const transform = this.options.transform;
    const columns = exchange.columns;
    if (!Object.isNull(columns) && exchange.shaped !== columns) {
      exchange.shaped = columns;
      exchange.reader = !Object.isNull(query.ownParsers) && mode !== RowMode.Raw ? RowReader.readColumns(columns, query.ownParsers) : columns;
    }

    const row = RowReader.read(data, start, exchange.reader, mode, mode === RowMode.Raw ? null : transform.valueFrom);
    const output = Object.isNull(transform.rowFrom) ? row : transform.rowFrom(row);
    if (Object.isNull(query.forEachFn))
      exchange.result.push(output);
    else
      query.forEachFn(output, exchange.result);
  }

  private handleCommandComplete(data: Buffer, start: number, end: number): void {
    const exchange = this.peekHead();
    const complete = Backend.readCommandComplete(data, start, end);
    const result = exchange.result;
    result.command = complete.command;
    result.count = complete.count;
    result.state = this.backend;
    result.statement = exchange;
    if (!Object.isNull(exchange.query))
      exchange.query.source = exchange;
    result.columns ??= exchange.columns;

    const final = exchange.final;
    if (!Object.isNull(final)) {
      if (!Object.isNull(exchange.stream)) {
        exchange.stream.count = complete.count;
        exchange.stream.command = complete.command;
      }
      exchange.final = null;
      final();
    }

    if (exchange.kind === ExchangeKind.Simple) {
      exchange.results.push(exchange.result);
      exchange.result = new Result();
      return;
    }

    exchange.completed = true;
    if (exchange.rows > 0) {
      exchange.finished = true;
      if (exchange.flushing)
        this.sync(exchange);
      const cursorFn = exchange.query?.cursorFn;
      if (result.count && !Object.isNullOrUndefined(cursorFn)) {
        const last = new Promise<unknown>(resolve => resolve(cursorFn(result)));
        last.catch(() => undefined);
        exchange.last = last;
      }
    }

    if (exchange.nosync && Object.isNull(exchange.error))
      this.completeExchange(exchange);
  }

  private markUnsafe(exchange: Exchange): void {
    this.rolling = true;
    exchange.own = new UnsafeTransactionException(Resources.unsafeTransaction);
    for (const item of this.sent)
      if (item.kind !== ExchangeKind.Local)
        item.own = new UnsafeTransactionException(Resources.unsafeTransaction);
    this.pending.unshift(new Exchange(ExchangeKind.Internal, null, null, item => {
      Frontend.writeQuery(this.out, Resources.rollback);
      item.synced = true;
      return WriteOutcome.Written;
    }));
  }

  private handleEmptyQueryResponse(): void {
    const exchange = this.peekHead();
    if (exchange.kind === ExchangeKind.Simple) {
      exchange.results.push(exchange.result);
      exchange.result = new Result();
    }
    if (exchange.nosync && Object.isNull(exchange.error))
      this.completeExchange(exchange);
  }

  private handlePortalSuspended(): void {
    const exchange = this.peekHead();
    if (!exchange.flushing) {
      exchange.suspended = true;
      return;
    }

    void this.continueCursorAsync(exchange);
  }

  private async continueCursorAsync(exchange: Exchange): Promise<void> {
    const query = PostgreSQLConnection.queryOf(exchange);
    try {
      exchange.awaiting = true;
      const next: unknown = await query.callCursor(exchange.result);
      exchange.awaiting = false;
      exchange.result = new Result();
      if (!Object.isNull(this.closedError) || exchange.synced || this.sent[0] !== exchange)
        return;
      if (!Object.isNull(query.aborted))
        throw query.aborted;

      if (next === CursorAction.Close) {
        Frontend.writeClose(this.out, MessageTarget.Portal, "");
        this.sync(exchange);
      }
      else {
        Frontend.writeExecute(this.out, "", exchange.rows);
        Frontend.writeFlush(this.out);
        this.schedule();
      }
    }
    catch (error) {
      exchange.awaiting = false;
      if (!Object.isNull(this.closedError) || exchange.synced || this.sent[0] !== exchange)
        return;
      this.fail(exchange, PostgreSQLConnection.toError(error));
    }

    this.refresh();
  }

  private handleErrorResponse(data: Buffer, start: number, end: number): void {
    const exchange = this.sent[0];
    const error = new PostgreSQLException(Backend.readError(data, start, end));
    if (Object.isUndefined(exchange)) {
      this.fatal = error;
      return;
    }

    exchange.stream?.destroy(error);
    const final = exchange.final;
    if (!Object.isNull(final)) {
      exchange.final = null;
      final(error);
    }
    this.fail(exchange, error);
  }

  private handleReadyForQuery(data: Buffer, start: number): void {
    this.currentStatus = Backend.readReadyForQuery(data, start);
    this.frames.setOwning(false);
    const exchange = this.sent.shift();
    if (Object.isUndefined(exchange))
      throw new DataException(Resources.unexpectedMessage);

    if (this.options.scheduler)
      this.recordTiming(exchange);
    exchange.done = true;
    exchange.open = false;
    if (exchange.kind === ExchangeKind.Internal)
      this.rolling = false;
    if (this.currentStatus !== TransactionStatus.Idle && !this.rolling && Object.isNull(exchange.lease) && Object.isNull(this.lease) && this.options.max !== 1)
      this.markUnsafe(exchange);
    if (this.blocker === exchange)
      this.blocker = null;
    this.settle(exchange);
    if (exchange.entry?.owner === exchange)
      exchange.entry.owner = null;
    for (let next = this.sent[0]; next?.kind === ExchangeKind.Local; next = this.sent[0]) {
      this.sent.shift();
      this.settle(next);
    }
    this.release();
    this.activateHead();

    if (this.closing && this.isIdle())
      this.terminate();
    this.events.onReady(this);
  }

  private activateHead(): void {
    const next = this.sent[0];
    if (Object.isUndefined(next) || Object.isNull(next.query))
      return;

    next.query.active = true;
    if (!Object.isNull(next.cancel))
      this.turn(next, next.cancel);
  }

  private settle(exchange: Exchange): void {
    this.markAnswered(exchange);
    if (exchange.kind === ExchangeKind.Internal)
      return;

    if (exchange.kind === ExchangeKind.Describe) {
      if (Object.isNull(exchange.error))
        exchange.resolve?.(new StatementShape(exchange.params ?? [], exchange.columns));
      else
        exchange.reject?.(exchange.error);
      return;
    }

    const query = PostgreSQLConnection.queryOf(exchange);
    const cursor = exchange.origin ?? (exchange.portal.length > 0 ? exchange : null);
    if (!Object.isNull(cursor) && (!Object.isNull(exchange.own) || !Object.isNull(exchange.error) || !exchange.suspended))
      this.unfence(cursor);

    if (!Object.isNull(exchange.own)) {
      query.reject(exchange.own);
      return;
    }
    if (!Object.isNull(exchange.error)) {
      this.handleFailure(exchange, exchange.error);
      return;
    }
    if (exchange.suspended) {
      this.handleSuspension(exchange, query);
      return;
    }

    const last = exchange.last;
    if (Object.isNull(last)) {
      if (!query.settled)
        this.finish(exchange, query);
      return;
    }

    last.then(() => {
      if (!query.settled)
        this.finish(exchange, query);
    }, (error: unknown) => {
      if (!query.settled)
        query.reject(PostgreSQLConnection.toError(error));
    });
  }

  private unfence(cursor: Exchange): void {
    if (!this.open.delete(cursor) || this.open.size > 0 || Object.isNull(this.fence))
      return;

    this.fence = null;
    this.release();
  }

  private handleFailure(exchange: Exchange, error: Error): void {
    const entry = exchange.kind === ExchangeKind.Query ? exchange.entry : null;
    const parsing = !Object.isNull(exchange.fresh) || (!Object.isNull(entry) && entry.owner === exchange && entry.state === PreparedState.Parsing);
    const code = error instanceof PostgreSQLException ? error.sqlState : null;
    const statement = exchange.statement;

    if (code === Resources.duplicatePreparedStatementState && exchange.kind === ExchangeKind.Query && !Object.isNull(statement) && statement.name.length > 0
      && parsing) {
      if (!Object.isNull(entry))
        this.drop(entry);
      statement.name += Resources.statementNameSuffix;
      if (this.isRetryable(exchange))
        this.retryExchange(exchange, null);
      else
        this.settleError(exchange, error);
      return;
    }

    if (Object.isNull(entry)) {
      this.settleError(exchange, error);
      return;
    }

    if (entry.owner === exchange && entry.state === PreparedState.Parsing) {
      this.drop(entry);
      this.settleError(exchange, error);
      return;
    }

    if (code === Resources.invalidStatementNameState) {
      this.drop(entry);
      if (this.isRetryable(exchange))
        this.retryExchange(exchange, null);
      else
        this.settleError(exchange, error);
      return;
    }

    if (exchange.bound) {
      this.settleError(exchange, error);
      return;
    }

    if (this.isRetryable(exchange)) {
      this.retryExchange(exchange, error);
      return;
    }

    this.markStale(entry);
    this.settleError(exchange, error);
  }

  private markStale(entry: PreparedStatement): void {
    if (this.prepared.get(entry.name) === entry)
      entry.state = PreparedState.Stale;
  }

  private isRetryable(exchange: Exchange): boolean {
    const query = exchange.query;
    return !exchange.retried
      && Object.isNull(exchange.batch)
      && Object.isNull(exchange.cancel)
      && !Object.isNull(query)
      && !query.cancelled
      && Object.isNull(query.cursorFn)
      && !exchange.streaming
      && exchange.lease === this.lease
      && this.currentStatus === TransactionStatus.Idle
      && !this.closing
      && (this.sent.length === 0 || (Object.isNull(exchange.lease) && this.options.max !== 1));
  }

  private retryExchange(exchange: Exchange, original: Error | null): void {
    const retry = new Exchange(ExchangeKind.Query, exchange.query, exchange.lease, item => this.writeExtended(item));
    retry.statement = exchange.statement;
    retry.ends = exchange.ends;
    retry.retried = true;
    retry.original = original;
    retry.previous = exchange.entry;
    retry.cost = exchange.cost;

    if (this.sent.length > 0) {
      this.enqueue(retry);
      return;
    }

    this.pending.unshift(retry);
    this.release();
  }

  private handleSuspension(exchange: Exchange, query: Query): void {
    const cursor = exchange.origin ?? exchange;
    this.running.add(query);
    new Promise<unknown>(resolve => resolve(query.callCursor(exchange.result))).then(next => {
      this.running.delete(query);
      if (query.settled) {
        this.unfence(cursor);
        return;
      }
      this.enqueue(this.step(cursor, next === CursorAction.Close || !Object.isNull(query.aborted), query.aborted));
    }, (error: unknown) => {
      this.running.delete(query);
      if (query.settled) {
        this.unfence(cursor);
        return;
      }
      this.enqueue(this.step(cursor, true, PostgreSQLConnection.toError(error)));
    });
  }

  private step(cursor: Exchange, end: boolean, failure: Error | null): Exchange {
    const exchange = new Exchange(ExchangeKind.Step, cursor.query, cursor.lease, item => this.writeCursorStep(item));
    exchange.origin = cursor;
    exchange.statement = cursor.statement;
    exchange.entry = cursor.entry;
    exchange.columns = cursor.columns;
    exchange.portal = cursor.portal;
    exchange.rows = cursor.rows;
    exchange.end = end;
    exchange.failure = failure;
    return exchange;
  }

  private writeCursorStep(exchange: Exchange): WriteOutcome {
    const cursor = exchange.origin;
    if (Object.isNull(cursor) || this.lease !== cursor.lease || cursor.epoch !== this.epoch) {
      if (!Object.isNull(exchange.failure))
        throw exchange.failure;
      if (!exchange.end)
        throw new UnsafeTransactionException(Resources.cursorOutlived);
      return WriteOutcome.Skipped;
    }

    exchange.own = exchange.failure;
    if (exchange.end)
      Frontend.writeClose(this.out, MessageTarget.Portal, exchange.portal);
    else
      Frontend.writeExecute(this.out, exchange.portal, exchange.rows);
    this.sync(exchange);
    return WriteOutcome.Written;
  }

  private finish(exchange: Exchange, query: Query): void {
    if (exchange.kind !== ExchangeKind.Simple) {
      query.resolve(exchange.result);
      return;
    }

    const results = exchange.results;
    query.resolve(results.length > 1 ? results : results[0] ?? exchange.result);
  }

  private handleNotificationResponse(data: Buffer, start: number): void {
    const notification = Backend.readNotification(data, start);
    PostgreSQLConnection.guard(() => this.events.onNotify(notification.channel, notification.payload, notification.pid));
  }

  private handleNoticeResponse(data: Buffer, start: number, end: number): void {
    const notice = Backend.readError(data, start, end);
    const onnotice = this.options.onnotice;
    if (Object.isNull(onnotice))
      console.log(Object.fromEntries(notice));
    else if (onnotice !== false)
      PostgreSQLConnection.guard(() => onnotice(notice));
  }

  private handleParameterStatus(data: Buffer, start: number): void {
    const [name, value] = Backend.readParameterStatus(data, start);
    this.parameters.set(name, value);
    PostgreSQLConnection.guard(() => this.events.onParameter(name, value));
  }

  private copyInResponse(): void {
    const exchange = this.peekHead();
    const stream = new CopyInStream(this, exchange);
    exchange.stream = stream;
    PostgreSQLConnection.queryOf(exchange).resolve(stream);
  }

  private copyOutResponse(): void {
    const exchange = this.peekHead();
    const stream = new CopyOutStream(this, exchange);
    exchange.stream = stream;
    exchange.open = false;
    this.frames.setOwning(true);
    PostgreSQLConnection.queryOf(exchange).resolve(stream);
  }

  private copyBothResponse(): void {
    const exchange = this.peekHead();
    const stream = new CopyBothStream(this, exchange);
    exchange.stream = stream;
    this.frames.setOwning(true);
    PostgreSQLConnection.queryOf(exchange).resolve(stream);
  }

  private copyData(data: Buffer, start: number, end: number): void {
    const exchange = this.peekHead();
    const stream = exchange.stream;
    if (!(stream instanceof Readable))
      return;

    exchange.wanted = false;
    if (!stream.push(data.subarray(start + 5, end)) && !exchange.wanted) {
      this.frames.pause();
      this.socket.pause();
    }
  }

  private copyDone(): void {
    this.frames.setOwning(false);
    const exchange = this.peekHead();
    if (exchange.stream instanceof Readable)
      exchange.stream.push(null);
    exchange.stream = null;
  }

  private peekHead(): Exchange {
    const head = this.sent[0];
    if (Object.isUndefined(head))
      throw new DataException(Resources.unexpectedMessage);

    return head;
  }

  private static recordShape(entry: PreparedStatement, statement: QueryStatement, columns: readonly Column[]): void {
    const shape = (entry.oids ?? []).join() + Resources.shapeSeparator + columns.map(column => column.type).join();
    if (statement.shape !== shape) {
      if (!Object.isNull(statement.shape))
        statement.version += 1;
      statement.shape = shape;
    }
    entry.version = statement.version;
  }

  private static isUsable(entry: PreparedStatement, statement: QueryStatement): boolean {
    return entry.state === PreparedState.Parsing || (entry.state === PreparedState.Ready && entry.version === statement.version);
  }

  private static isSameShape(entry: PreparedStatement, params: readonly number[], columns: readonly Column[]): boolean {
    const oids = entry.oids ?? [];
    const known = entry.columns;
    return !Object.isNull(known)
      && oids.length === params.length && params.every((oid, index) => oid === oids[index])
      && known.length === columns.length && columns.every((column, index) => column.type === known[index]?.type);
  }

  private static hasInferredTypes(built: BuiltQuery): boolean {
    return built.oids.some(oid => !oid);
  }

  private static isEnding(statement: QueryStatement): boolean {
    statement.ends ??= Resources.endingStatement.test(statement.text);
    return statement.ends;
  }

  private static readWire(query: Query): QueryWire {
    if (Object.isNull(query.wire))
      throw new DataException(Resources.queryWithoutStatement);

    return query.wire;
  }

  private static queryOf(exchange: Exchange): Query {
    if (Object.isNull(exchange.query))
      throw new DataException(Resources.unexpectedMessage);

    return exchange.query;
  }

  private static readStatement(exchange: Exchange): QueryStatement {
    return PostgreSQLConnection.readWire(PostgreSQLConnection.queryOf(exchange)).statement;
  }

  private static guard(action: () => void): void {
    try {
      action();
    }
    catch {
      return;
    }
  }

  private static toError(error: unknown): Error {
    return error instanceof Error ? error : new DataException(Resources.nonErrorThrown, new ExceptionOptions(error));
  }
}
