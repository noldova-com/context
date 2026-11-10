/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { RowMode } from "../../enums/row-mode.js";
import { CancelUnansweredException } from "../../exceptions/cancel-unanswered.exception.js";
import { ConnectionClosedException } from "../../exceptions/connection-closed.exception.js";
import { PostgreSQLException } from "../../exceptions/postgresql.exception.js";
import { QueryCanceledException } from "../../exceptions/query-canceled.exception.js";
import { QueryTimeoutException } from "../../exceptions/query-timeout.exception.js";
import type { BackendKey } from "../backend-key.js";
import type { BuiltQuery } from "../built-query.js";
import type { Column } from "../column.js";
import type { QueryCost } from "../query-cost.js";
import { QueryOptions } from "../query-options.js";
import type { QueryWire } from "../query-wire.js";
import type { Result } from "../result.js";
import type { StatementDescription } from "../statement-description.js";
import { Resources } from "../../resources.js";
import type { QueryOutcome } from "../../types/query-outcome.js";
import type { ValueParser } from "../../types/value-parser.js";
import { CursorIterator } from "../../services/client/cursor-iterator.js";
import { Deferred } from "./deferred.js";
import type { Exchange } from "./exchange.js";
import type { PostgreSQLConnection } from "./postgresql-connection.js";
import type { QueryHandler } from "../../services/client/query-handler.js";

export class Query implements PromiseLike<QueryOutcome> {
  public readonly built: BuiltQuery;
  public readonly handler: QueryHandler;
  public readonly options: QueryOptions;
  public wire: QueryWire | null = null;
  public state: BackendKey | null = null;
  public source: Exchange | null = null;
  public active: boolean = false;
  public executed: boolean = false;
  public settled: boolean = false;
  public timer: number | null = null;
  public timedOut: boolean = false;
  public cursorRows: number = 0;
  public cursorFn: ((rows: Result) => unknown) | null = null;
  public forEachFn: ((row: unknown, result: Result) => void) | null = null;
  public streaming: boolean = false;
  public onlyDescribe: boolean = false;
  public rowMode: RowMode = RowMode.Object;
  public ownParsers: ((column: Column) => ValueParser | null) | ReadonlyMap<number, ValueParser | null> | null = null;
  public parts: readonly Query[] | null = null;
  public owner: Query | null = null;
  public alone: boolean = false;
  public cost: QueryCost | null = null;
  public cancelled: boolean = false;
  public aborted: Error | null = null;
  public onwrite: (() => void) | null = null;
  public connection: PostgreSQLConnection | null = null;
  private readonly deferred: Deferred<QueryOutcome> = new Deferred<QueryOutcome>();
  private resolver: ((value: QueryOutcome) => void) | null = null;
  private rejecter: ((error: Error) => void) | null = null;
  private aborts: (() => void) | null = null;

  public constructor(built: BuiltQuery, handler: QueryHandler, options: QueryOptions = new QueryOptions()) {
    this.built = built;
    this.handler = handler;
    this.options = options;
  }

  public get promise(): Promise<QueryOutcome> {
    return this.deferred.promise;
  }

  public get statement(): StatementDescription | null {
    return Object.isNull(this.source) ? null : this.source.describe();
  }

  public get text(): string {
    return this.build().text;
  }

  public get parameters(): readonly unknown[] {
    return this.build().values;
  }

  public build(): BuiltQuery {
    return this.built;
  }

  public redirect(resolve: (value: QueryOutcome) => void, reject: (error: Error) => void): void {
    this.resolver = resolve;
    this.rejecter = reject;
  }

  public resolve(value: QueryOutcome): void {
    if (Object.isNull(this.resolver))
      this.complete(value);
    else
      this.resolver(value);
  }

  public reject(error: Error): void {
    if (Object.isNull(this.rejecter))
      this.fail(error);
    else
      this.rejecter(error);
  }

  public complete(value: QueryOutcome): void {
    this.finish();
    this.deferred.resolve(value);
  }

  public fail(error: Error): void {
    const failure = this.timedOut && Query.isTimeout(error) ? this.createLateError(error) : error;
    this.finish();
    this.deferred.reject(failure);
  }

  public finish(): void {
    this.clearTimer();
    this.aborts?.();
    this.active = false;
    this.settled = true;
  }

  public cancelAsync(): Promise<void> {
    return Object.isNull(this.owner) ? this.handler.cancelAsync(this) : this.owner.cancelAsync();
  }

  public useSignal(signal: AbortSignal | null): this {
    if (Object.isNull(signal) || this.settled)
      return this;

    if (signal.aborted) {
      this.cancelAsync().catch(() => undefined);
      return this;
    }

    const abort = (): void => {
      this.cancelAsync().catch(() => undefined);
    };
    signal.addEventListener(Resources.abortEvent, abort, { once: true });
    this.aborts = (): void => {
      this.aborts = null;
      signal.removeEventListener(Resources.abortEvent, abort);
    };
    return this;
  }

  public useSimpleProtocol(): this {
    this.options.simple = true;
    this.options.prepare = false;
    return this;
  }

  public openReadableAsync(): Promise<QueryOutcome> {
    this.useSimpleProtocol();
    this.streaming = true;
    return this.then(value => value);
  }

  public openWritableAsync(): Promise<QueryOutcome> {
    this.useSimpleProtocol();
    this.streaming = true;
    return this.then(value => value);
  }

  public useCursor(rows: number, callback: (rows: Result) => unknown): this {
    this.options.simple = false;
    this.cursorRows = rows;
    this.cursorFn = callback;
    return this;
  }

  public callCursor(rows: Result): unknown {
    return Object.isNull(this.cursorFn) ? undefined : this.cursorFn(rows);
  }

  public iterateCursor(rows: number = 1): AsyncIterable<Result> {
    this.options.simple = false;
    this.cursorRows = rows;
    return new CursorIterator(this);
  }

  public describe(): this {
    this.options.simple = false;
    this.onlyDescribe = true;
    this.options.prepare = true;
    return this;
  }

  public forEach(callback: (row: unknown, result: Result) => void): this {
    this.forEachFn = callback;
    this.handle();
    return this;
  }

  public useRawRows(): this {
    this.rowMode = RowMode.Raw;
    return this;
  }

  public useValueRows(): this {
    this.rowMode = RowMode.Values;
    return this;
  }

  public useParsers(parsers: ((column: Column) => ValueParser | null) | ReadonlyMap<number, ValueParser | null> | null): this {
    this.ownParsers = parsers;
    return this;
  }

  public handle(): void {
    if (this.executed)
      return;

    this.executed = true;
    queueMicrotask(() => this.run());
  }

  public execute(): this {
    this.handle();
    return this;
  }

  public then<TResult1 = QueryOutcome, TResult2 = never>(
    onfulfilled?: ((value: QueryOutcome) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null): Promise<TResult1 | TResult2> {
    this.handle();
    return this.deferred.promise.then(onfulfilled, onrejected);
  }

  public catch<TResult = never>(onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null): Promise<QueryOutcome | TResult> {
    this.handle();
    return this.deferred.promise.catch(onrejected);
  }

  public finally(onfinally?: (() => void) | null): Promise<QueryOutcome> {
    this.handle();
    return this.deferred.promise.finally(onfinally);
  }

  private run(): void {
    this.handler.handle(this);
  }

  private clearTimer(): void {
    if (Object.isNull(this.timer))
      return;

    this.handler.options.timers.clearTimeout(this.timer);
    this.timer = null;
  }

  private createLateError(error: Error): QueryTimeoutException {
    const cause = error instanceof ConnectionClosedException && error.destroyed ? error.cause : error;
    return new QueryTimeoutException(this.handler.options.queryTimeout, cause);
  }

  private static isTimeout(error: Error): boolean {
    if (error instanceof QueryCanceledException)
      return true;
    if (error instanceof PostgreSQLException)
      return error.sqlState === Resources.queryCanceledState;

    return error instanceof ConnectionClosedException && error.destroyed && error.cause instanceof CancelUnansweredException;
  }
}
