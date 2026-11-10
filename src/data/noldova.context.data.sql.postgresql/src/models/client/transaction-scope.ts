/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { PostgreSQLException } from "../../exceptions/postgresql.exception.js";
import { TransactionRolledBackException } from "../../exceptions/transaction-rolled-back.exception.js";
import { UnsafeTransactionException } from "../../exceptions/unsafe-transaction.exception.js";
import { BuiltQuery } from "../built-query.js";
import type { ClientOptions } from "../client-options.js";
import { QueryOptions } from "../query-options.js";
import { Result } from "../result.js";
import type { TransactionState } from "../transaction-state.js";
import { Resources } from "../../resources.js";
import type { TransactionResult } from "../../types/transaction-result.js";
import type { TypeRegistry } from "../type-registry.js";
import type { PoolLease } from "./pool-lease.js";
import { Query } from "./query.js";
import type { QueryHandler } from "../../services/client/query-handler.js";
import { SqlRunner } from "../../services/client/sql-runner.js";

export class TransactionScope extends SqlRunner implements QueryHandler {
  private readonly state: TransactionState;
  private readonly name: string | null;
  private readonly inside: boolean;
  private readonly above: () => boolean;
  private uncaught: Error | null = null;
  private rolled: Promise<void> | null = null;
  private after: TransactionRolledBackException | null = null;

  public constructor(types: TypeRegistry, state: TransactionState, name: string | null, inside: boolean, above: () => boolean) {
    super(types);
    this.state = state;
    this.name = name;
    this.inside = inside;
    this.above = above;
  }

  public get options(): ClientOptions {
    return this.state.lease.options;
  }

  protected override get handler(): QueryHandler {
    return this;
  }

  private get stopped(): boolean {
    return !Object.isNull(this.rolled) || this.above();
  }

  public static runControl(lease: PoolLease, text: string): Query {
    return new Query(new BuiltQuery(text, [], []), lease, new QueryOptions(true)).execute();
  }

  public handle(query: Query): void {
    if (this.stopped) {
      this.after ??= new TransactionRolledBackException(Resources.transactionRolledBack);
      query.reject(this.after);
      return;
    }

    query.promise.then(undefined, (error: Error) => {
      this.uncaught ??= error;
    });
    this.state.lease.send(query);
  }

  public cancelAsync(query: Query): Promise<void> {
    return this.state.lease.cancelAsync(query);
  }

  public runInSavepointAsync<T>(callback: (scope: TransactionScope) => T): Promise<TransactionResult<T>>;
  public runInSavepointAsync<T>(name: string, callback: (scope: TransactionScope) => T): Promise<TransactionResult<T>>;
  public runInSavepointAsync<T>(name: string | ((scope: TransactionScope) => T), callback?: (scope: TransactionScope) => T): Promise<unknown> {
    const suffix = Object.isString(name) ? Resources.savepointNameSeparator + name : String.empty;
    return this.nestAsync(suffix, false, Object.isString(name) ? callback : name);
  }

  public beginAsync<T>(callback: (scope: TransactionScope) => T): Promise<TransactionResult<T>>;
  public beginAsync<T>(mode: string, callback: (scope: TransactionScope) => T): Promise<TransactionResult<T>>;
  public async beginAsync<T>(mode: string | ((scope: TransactionScope) => T), callback?: (scope: TransactionScope) => T): Promise<unknown> {
    const inner = Object.isString(mode) ? TransactionScope.normalizeMode(mode) : String.empty;
    if (inner.length > 0 && inner !== TransactionScope.normalizeMode(this.state.mode))
      throw new UnsafeTransactionException(Resources.nestedTransactionMode);

    return await this.nestAsync(String.empty, true, Object.isString(mode) ? callback : mode);
  }

  public rollbackAsync(): Promise<void> {
    this.rolled ??= TransactionScope.runControl(this.state.lease, this.rollbackText()).then(() => undefined);
    return this.rolled;
  }

  public prepare(name: string): void {
    if (this.inside)
      throw new UnsafeTransactionException(Resources.nestedTransactionPrepare);

    this.state.prepared = name.replace(/[^a-z0-9$\-_. ]/giu, String.empty);
  }

  public async runAsync(callback: ((scope: TransactionScope) => unknown) | undefined): Promise<unknown> {
    if (this.above())
      throw new TransactionRolledBackException(Resources.transactionRolledBack);

    const lease = this.state.lease;
    if (!Object.isNull(this.name))
      await TransactionScope.runControl(lease, Resources.savepointPrefix + SqlRunner.quote(this.name));

    let result: unknown;
    try {
      result = await TransactionScope.settleAsync(callback, this);
      if (!Object.isNull(this.uncaught) && !this.stopped)
        throw this.uncaught;
      if (!Object.isNull(lease.error))
        throw lease.error;
    }
    catch (error) {
      if (!this.stopped) {
        if (Object.isNull(lease.connection.closed))
          await TransactionScope.runControl(lease, this.rollbackText());
      }
      else if (!Object.isNull(this.rolled))
        await this.rolled.catch(() => undefined);
      throw error instanceof PostgreSQLException && error.sqlState === Resources.transactionAbortedState && !Object.isNull(this.uncaught) ? this.uncaught : error;
    }

    if (this.stopped) {
      await this.rolled;
      if (!Object.isNull(this.after))
        throw this.after;

      return result;
    }

    if (Object.isNull(this.name))
      await this.finishAsync();
    return result;
  }

  private async finishAsync(): Promise<void> {
    const prepared = this.state.prepared;
    const text = Object.isNull(prepared)
      ? Resources.commitStatement
      : Resources.prepareTransactionPrefix + Resources.stringQuote + prepared.replaceAll(Resources.stringQuote, Resources.escapedStringQuote) + Resources.stringQuote;
    const done = await TransactionScope.runControl(this.state.lease, text);
    if (Object.isNull(prepared) && (!(done instanceof Result) || done.command !== Resources.commitCommand))
      throw new TransactionRolledBackException(Resources.transactionRolledBackByServer);
  }

  private nestAsync(suffix: string, inside: boolean, callback: ((scope: TransactionScope) => unknown) | undefined): Promise<unknown> {
    const name = Resources.savepointNamePrefix + String(this.state.savepoints) + suffix;
    this.state.savepoints += 1;
    return new TransactionScope(this.types, this.state, name, inside, () => this.stopped).runAsync(callback);
  }

  private rollbackText(): string {
    return Object.isNull(this.name) ? Resources.rollback : Resources.rollbackToPrefix + SqlRunner.quote(this.name);
  }

  private static async settleAsync(callback: ((scope: TransactionScope) => unknown) | undefined, scope: TransactionScope): Promise<unknown> {
    const value = callback?.(scope);
    return Array.isArray(value) ? Promise.all(value) : value;
  }

  private static normalizeMode(mode: string): string {
    return mode.toLowerCase().replace(/[^a-z ]/gu, String.empty).replace(/\s+/gu, Resources.space).trim();
  }
}
