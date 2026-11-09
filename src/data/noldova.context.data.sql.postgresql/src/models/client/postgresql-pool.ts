/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { DataException } from "@noldova/context.data";
import { ExceptionOptions } from "@noldova/context.exceptions";

import type { LeaseKind } from "../../enums/lease-kind.js";
import { TransactionStatus } from "../../enums/transaction-status.js";
import { BatchException } from "../../exceptions/batch.exception.js";
import { ConnectionClosedException } from "../../exceptions/connection-closed.exception.js";
import { ConnectionEndedException } from "../../exceptions/connection-ended.exception.js";
import { PostgreSQLException } from "../../exceptions/postgresql.exception.js";
import { QueryCanceledException } from "../../exceptions/query-canceled.exception.js";
import { QueueTimeoutException } from "../../exceptions/queue-timeout.exception.js";
import { TypeNotFoundException } from "../../exceptions/type-not-found.exception.js";
import { BuiltQuery } from "../built-query.js";
import type { ClientOptions } from "../client-options.js";
import type { ConnectionOptions } from "../connection-options.js";
import { PoolStats } from "../pool-stats.js";
import { QueryOptions } from "../query-options.js";
import { QueryWire } from "../query-wire.js";
import { Result } from "../result.js";
import type { StartedSession } from "../started-session.js";
import { StatementDescription } from "../statement-description.js";
import { Resources } from "../../resources.js";
import type { BinaryDecoder } from "../../types/binary-decoder.js";
import type { ValueParser } from "../../types/value-parser.js";
import type { ValueSerializer } from "../../types/value-serializer.js";
import type { SessionStarter } from "../../services/session-starter.js";
import type { TypeRegistry } from "../type-registry.js";
import type { ClientTimers } from "./client-timers.js";
import { ConnectionEvents } from "../../services/client/connection-events.js";
import { PoolJob } from "./pool-job.js";
import { PoolLease } from "./pool-lease.js";
import { PoolQueue } from "./pool-queue.js";
import { PostgreSQLConnection } from "./postgresql-connection.js";
import { Query } from "./query.js";
import type { QueryHandler } from "../../services/client/query-handler.js";
import { StatementCache } from "./statement-cache.js";
import { TypeLoaderEvents } from "../../services/client/type-loader-events.js";

export class PostgreSQLPool extends ConnectionEvents implements QueryHandler {
  private static readonly window: number = 2000;
  private static readonly retypeDelay: number = 1000;

  public readonly parameters: Map<string, string> = new Map();

  private readonly clientOptions: ClientOptions;
  private readonly connection: ConnectionOptions;
  private readonly types: TypeRegistry;
  private readonly starter: (options: ConnectionOptions) => SessionStarter;
  private readonly timers: ClientTimers;
  private readonly statements: StatementCache;
  private readonly connections: Set<PostgreSQLConnection> = new Set();
  private readonly waiting: PoolQueue<PoolJob> = new PoolQueue<PoolJob>();
  private readonly starting: Set<SessionStarter> = new Set();
  private readonly paused: Set<PostgreSQLConnection> = new Set();
  private readonly eager: boolean;
  private workFast: number = 0;
  private workSlow: number = 0;
  private workAt: number = 0;
  private aborted: boolean = false;
  private opening: number = 0;
  private cancelling: number = 0;
  private readonly cancelAbort: AbortController = new AbortController();
  private ending: Promise<void> | null = null;
  private ended: (() => void) | null = null;
  private used: boolean = false;
  private endTimer: number | null = null;
  private retries: number = 0;
  private failingSince: number | null = null;
  private nextAttempt: number = 0;
  private retryTimer: number | null = null;
  private typesLoaded: boolean;
  private isTyped: boolean;
  private typesError: TypeNotFoundException | null = null;
  private typesFailed: number = 0;
  private failure: Error | null = null;
  private typesLoading: boolean = false;
  private separate: boolean = false;
  private loader: PostgreSQLConnection | null = null;
  private retryTypes: number | null = null;
  private typeRetries: number = 0;
  private typesFailing: number | null = null;

  public constructor(options: ClientOptions, connection: ConnectionOptions, types: TypeRegistry, starter: (options: ConnectionOptions) => SessionStarter) {
    super();
    this.clientOptions = options;
    this.connection = connection;
    this.types = types;
    this.starter = starter;
    this.timers = options.timers;
    this.statements = new StatementCache(options.scheduler);
    this.eager = types.named || options.eagerTypes;
    this.typesLoaded = !options.fetchTypes;
    this.isTyped = this.typesLoaded;
  }

  public get options(): ClientOptions {
    return this.clientOptions;
  }

  public get stats(): PoolStats {
    const all = [...this.connections];
    return new PoolStats(
      all.length,
      this.opening,
      all.filter(connection => connection.inflight === 0 && Object.isNull(connection.lease)).length,
      all.filter(connection => !Object.isNull(connection.lease)).length,
      this.waiting.length);
  }

  public override get typed(): boolean {
    return this.isTyped;
  }

  public override get plain(): boolean {
    return this.types.plain;
  }

  public override get cancels(): AbortSignal {
    return this.cancelAbort.signal;
  }

  public override findParser(oid: number): ValueParser | null {
    return this.types.findParser(oid);
  }

  public override findDecoder(oid: number, parser: ValueParser | null): BinaryDecoder | null {
    return this.types.findDecoder(oid, parser);
  }

  public override findBinaryDecoder(oid: number): BinaryDecoder | null {
    return this.types.findBinaryDecoder(oid);
  }

  public override findSerializer(oid: number): ValueSerializer {
    return this.types.findSerializer(oid);
  }

  public override hasUnknownTypes(oids: readonly number[]): boolean {
    return !this.typesLoaded && this.types.hasUnknownTypes(oids);
  }

  public handle(query: Query): void {
    this.query(query, null);
  }

  public query(query: Query, lease: PoolLease | null): void {
    if (this.clientOptions.queryTimeout > 0 && Object.isNull(query.timer) && !query.settled && Object.isNull(query.cursorFn) && !query.streaming)
      this.armDeadline(query);

    if (!Object.isNull(this.ending) && Object.isNull(lease)) {
      query.reject(this.createEndedError());
      return;
    }

    if (!Object.isNull(query.parts)) {
      this.batch(query, query.parts, lease);
      return;
    }

    let built: BuiltQuery;
    try {
      built = query.build();
    }
    catch (error) {
      this.rejectUnbuilt(query, PostgreSQLPool.toError(error), lease);
      return;
    }

    const free = Object.isNull(lease) && this.clientOptions.max !== 1;
    if (query.options.simple && built.values.length === 0) {
      const known = free || this.clientOptions.scheduler ? this.statements.readCost(built.text) : null;
      query.alone = free && !Object.isNull(known) && StatementCache.isAlone(known, built.text);
      if (this.clientOptions.scheduler)
        query.cost = known;
      const text = built.text;
      const job = this.createJob(query, connection => connection.sendSimple(query, text));
      job.plain = true;
      job.exclusive = query.streaming || query.alone;
      this.place(job, lease);
      return;
    }

    if (query.onlyDescribe) {
      this.describeOnly(query, built, lease);
      return;
    }

    const statement = this.statements.get(built, this.clientOptions.prepare && query.options.prepare !== false);
    query.alone = free && StatementCache.isAlone(statement.live ? statement : this.statements.readCost(built.text), built.text);
    query.wire = new QueryWire(statement, built);
    if (this.clientOptions.scheduler)
      query.cost = statement.cost;
    const job = this.createJob(query, connection => connection.send(query));
    job.plain = true;
    job.statement = statement;
    job.typed = !this.typesLoaded && this.hasUntypedOids(built.oids);
    job.exclusive = !Object.isNull(query.cursorFn) || query.streaming || query.alone;
    this.place(job, lease);
  }

  public async acquireLeaseAsync(kind: LeaseKind): Promise<PoolLease> {
    this.used = true;
    await Promise.resolve();
    if (!Object.isNull(this.ending))
      throw this.createEndedError();

    const failing = this.readFastFailure();
    if (!Object.isNull(failing))
      throw failing;

    const missing = this.retype();
    if (!Object.isNull(missing))
      throw missing;

    return new Promise<PoolLease>((resolve, reject) => {
      const job = new PoolJob(null, connection => resolve(this.grant(connection, kind)), reject);
      job.lease = true;
      this.waiting.push(this.wait(job));
      this.drain();
    });
  }

  public cancelAsync(query: Query): Promise<void> {
    const removed = this.waiting.remove(job => {
      if (job.query !== query)
        return false;

      this.markStarted(job);
      return true;
    });
    if (removed) {
      query.reject(new QueryCanceledException());
      return Promise.resolve();
    }

    const connection = query.connection;
    if (!Object.isNull(connection))
      return connection.cancelAsync(query);

    query.cancelled = true;
    return Promise.resolve();
  }

  public endAsync(timeout: number | null = null): Promise<void> {
    if (!Object.isNull(this.ending))
      return this.ending;

    this.ending = new Promise<void>(resolve => {
      this.ended = (): void => resolve();
      if (!Object.isNull(timeout))
        this.endTimer = this.timers.setTimeout(() => this.destroy(), timeout * 1000);
      this.timers.clearTimeout(this.retryTimer);
      this.retryTimer = null;
      queueMicrotask(() => this.finishEnding());
    });
    return this.ending;
  }

  public async closeAsync(): Promise<void> {
    this.used = false;
    await Promise.all([...this.connections].map(connection => Object.isNull(connection.lease)
      ? connection.closeAsync()
      : new Promise<void>(resolve => {
        connection.retiring = true;
        connection.retired.push(() => resolve());
      })));
  }

  public override requestTypes(connection: PostgreSQLConnection | null): void {
    if (!Object.isNull(connection))
      this.paused.add(connection);
    if (this.typesLoaded) {
      this.resume();
      return;
    }

    if (this.typesLoading)
      return;

    this.typesLoading = true;
    const idle = [...this.connections].find(item => !this.paused.has(item) && this.isUsable(item) && item.inflight === 0);
    if (Object.isUndefined(idle))
      this.watchTypeLoad(this.loadTypesSeparatelyAsync());
    else
      this.watchTypeLoad(this.types.loadAsync(this.createRunner(idle, false)));
  }

  public override onReady(connection: PostgreSQLConnection): void {
    if (connection.releasing) {
      if (connection.inflight > 0)
        return;

      connection.releasing = false;
      if (connection.status !== TransactionStatus.Idle) {
        connection.closeAsync();
        return;
      }
    }

    if (connection.inflight === 0 && Object.isNull(connection.lease)
      && (connection.retiring || (!Object.isNull(this.ending) && this.waiting.length === 0))) {
      connection.closeAsync();
      return;
    }

    this.handleIdle(connection);
    for (let job = this.waiting.peek(); !Object.isUndefined(job) && this.waiting.length > this.connections.size + this.opening && this.isUsable(connection)
      && connection.inflight < this.clientOptions.maxPipeline && job.plain && !job.exclusive; job = this.waiting.peek()) {
      this.waiting.shift();
      this.run(connection, job);
    }

    if (this.waiting.length > 0 && Object.isNull(connection.lease) && connection.inflight < this.clientOptions.maxPipeline)
      this.drain();
    if (!Object.isNull(this.ending) && this.waiting.length === 0)
      this.finishEnding();
  }

  public override onClose(connection: PostgreSQLConnection, error: ConnectionClosedException): void {
    this.connections.delete(connection);
    if ((connection.loading || !Object.isNull(connection.typing)) && !this.aborted)
      this.recordFailedAttempt(error);
    this.paused.delete(connection);
    for (const resolve of connection.retired)
      resolve();
    this.timers.clearTimeout(connection.idleTimer);
    this.timers.clearTimeout(connection.lifeTimer);
    const lease = connection.lease;
    if (!Object.isNull(lease))
      lease.onClose(PostgreSQLPool.createLostError(connection, error));
    this.clientOptions.onclose?.(connection.id);
    if (this.connections.size === 0 && this.opening === 0)
      this.statements.clear();
    this.drain();
    if (!Object.isNull(this.ending))
      this.finishEnding();
  }

  public override onNotify(channel: string, payload: string, pid: number): void {
    this.clientOptions.onnotify?.(channel, payload, pid);
  }

  public override onParameter(name: string, value: string): void {
    if (this.parameters.get(name) === value)
      return;

    this.parameters.set(name, value);
    this.clientOptions.onparameter?.(name, value);
  }

  public override onCancelling(cancel: Promise<void>): void {
    this.cancelling += 1;
    const settled = (): void => {
      this.cancelling -= 1;
      this.finishEnding();
    };
    cancel.then(settled, settled);
  }

  public override onTimed(sample: number, time: number): void {
    this.decay(time);
    if (sample < PostgreSQLConnection.slow)
      this.workFast += sample;
    else
      this.workSlow += sample;
  }

  private createJob(query: Query, send: (connection: PostgreSQLConnection) => void): PoolJob {
    return new PoolJob(query, connection => {
      query.connection = connection;
      send(connection);
      query.onwrite?.();
    }, error => query.reject(error));
  }

  private hasUntypedOids(oids: readonly number[]): boolean {
    return oids.some(oid => oid !== 0 && !this.types.isKnown(oid));
  }

  private armDeadline(query: Query): void {
    query.timer = this.timers.setTimeout(() => {
      query.timer = null;
      if (!query.settled) {
        query.timedOut = true;
        this.cancelAsync(query).catch(PostgreSQLPool.ignore);
      }
    }, this.clientOptions.queryTimeout * 1000);
  }

  private batch(query: Query, parts: readonly Query[], lease: PoolLease | null): void {
    if (parts.length === 0) {
      query.resolve([]);
      return;
    }

    for (const [index, part] of parts.entries()) {
      try {
        part.build();
      }
      catch (error) {
        this.rejectUnbuilt(query, new BatchException(index, PostgreSQLPool.toError(error)), lease);
        return;
      }
    }

    for (const part of parts) {
      const built = part.build();
      part.wire = new QueryWire(this.statements.get(built, this.clientOptions.prepare && part.options.prepare !== false), built);
    }

    const job = this.createJob(query, connection => connection.batch(query, parts));
    job.typed = !this.typesLoaded && parts.some(part => this.hasUntypedOids(part.build().oids));
    this.place(job, lease);
  }

  private describeOnly(query: Query, built: BuiltQuery, lease: PoolLease | null): void {
    const describe = (connection: PostgreSQLConnection): void => {
      connection.describeAsync(built.text, built.oids, query).then(
        shape => query.resolve(new StatementDescription("", built.text, shape.params, shape.columns ?? [])),
        (error: unknown) => query.reject(PostgreSQLPool.toError(error)));
    };
    const job = this.createJob(query, describe);
    if (Object.isNull(lease))
      this.place(job, null);
    else
      job.run(lease.connection);
  }

  private rejectUnbuilt(query: Query, error: Error, lease: PoolLease | null): void {
    if (Object.isNull(lease) || lease.released || !Object.isNull(lease.connection.closed)) {
      query.reject(error);
      return;
    }

    query.connection = lease.connection;
    lease.connection.failLocally(query, error);
    query.onwrite?.();
  }

  private place(job: PoolJob, lease: PoolLease | null): void {
    this.used = true;
    const missing = Object.isNull(lease) ? this.retype() : null;
    if (!Object.isNull(missing)) {
      this.reject(job, missing);
      return;
    }

    if (job.query?.cancelled === true) {
      this.reject(job, new QueryCanceledException());
      return;
    }

    if (!Object.isNull(lease)) {
      const closed = lease.connection.closed;
      if (!Object.isNull(closed))
        this.reject(job, closed);
      else if (lease.released)
        this.reject(job, lease.createEndedError());
      else
        this.run(lease.connection, job);
      return;
    }

    const failing = this.readFastFailure();
    if (!Object.isNull(failing)) {
      this.reject(job, failing);
      return;
    }

    const connection = this.waiting.length === 0 ? this.pick(job) : null;
    if (!Object.isNull(connection)) {
      this.run(connection, job);
      return;
    }

    this.waiting.push(this.wait(job));
    this.drain();
  }

  private wait(job: PoolJob): PoolJob {
    const seconds = this.clientOptions.queueTimeout;
    if (seconds <= 0)
      return job;

    const timer = this.timers.setTimeout(() => {
      job.timer = null;
      if (this.waiting.remove(item => item === job))
        this.reject(job, new QueueTimeoutException(seconds));
    }, seconds * 1000);
    this.timers.unref(timer);
    job.timer = timer;
    return job;
  }

  private markStarted(job: PoolJob): void {
    this.timers.clearTimeout(job.timer);
    job.timer = null;
  }

  private run(connection: PostgreSQLConnection, job: PoolJob): void {
    this.markStarted(job);
    this.hold(connection);
    job.run(connection);
  }

  private drain(): void {
    for (let job = this.waiting.peek(); !Object.isUndefined(job); job = this.waiting.peek()) {
      const connection = this.pick(job);
      if (Object.isNull(connection)) {
        if (!this.isEveryConnectionCopying(job))
          break;

        this.waiting.shift();
        this.reject(job, new DataException(Resources.copyInProgress));
      }
      else {
        this.waiting.shift();
        this.run(connection, job);
      }
    }

    this.grow();
  }

  private isEveryConnectionCopying(job: PoolJob): boolean {
    if (Object.isNull(job.query) || this.connections.size + this.opening < this.clientOptions.max || this.connections.size === 0)
      return false;

    for (const connection of this.connections)
      if (!connection.copying)
        return false;

    return true;
  }

  private isUsable(connection: PostgreSQLConnection): boolean {
    return Object.isNull(connection.closed) && !connection.closing && Object.isNull(connection.lease) && !connection.releasing && !connection.retiring
      && !connection.exclusive && !connection.loading;
  }

  private pick(job: PoolJob): PostgreSQLConnection | null {
    if (!this.typesLoaded && (this.eager ? job.lease || job.typed : job.typed)) {
      if (!this.eager)
        this.requestTypes(null);
      return null;
    }

    const name = Object.isNull(job.statement) ? "" : job.statement.name;
    let best: PostgreSQLConnection | null = null;
    let soon = false;
    for (const connection of this.connections) {
      if (connection.loading && Object.isNull(connection.closed))
        soon = true;
      const free = this.isUsable(connection);
      if (free && PostgreSQLPool.isQuiet(connection)) {
        if (name.length === 0 || connection.prepared.has(name))
          return connection;
        best = !Object.isNull(best) && PostgreSQLPool.isQuiet(best) ? best : connection;
      }
      else if (free && !job.lease && !job.exclusive && connection.inflight < this.clientOptions.maxPipeline
        && (Object.isNull(best) || connection.inflight < best.inflight))
        best = connection;
    }

    if (!Object.isNull(best) && PostgreSQLPool.isQuiet(best))
      return best;
    if (soon || (this.connections.size + this.opening < this.clientOptions.max && Object.isNull(this.failingSince)))
      return null;

    const query = job.query;
    if (!Object.isNull(best) && this.clientOptions.scheduler && !Object.isNull(query) && this.needsScheduling(query)) {
      const scheduled = this.chooseConnection(query);
      if (!Object.isNull(scheduled))
        best = scheduled;
    }
    return !Object.isNull(best) && this.opening > 0 && best.inflight >= Math.ceil(this.waiting.length / (this.opening + 1)) ? null : best;
  }

  private needsScheduling(query: Query): boolean {
    const estimate = query.cost?.estimate ?? null;
    if (Object.isNull(estimate) || estimate >= PostgreSQLConnection.notable)
      return true;

    for (const connection of this.connections)
      if (connection.notable)
        return true;

    return false;
  }

  private chooseConnection(query: Query): PostgreSQLConnection | null {
    const time = this.timers.readTime();
    const estimate = query.cost?.estimate ?? null;
    if (Object.isNull(estimate) || estimate < PostgreSQLConnection.slow)
      return this.findSoonest(time, Infinity, false);

    let heavy = 0;
    for (const connection of this.connections)
      if (connection.inflight > 0 && connection.isHeavy())
        heavy += 1;

    this.decay(time);
    const size = this.connections.size;
    const reserve = Math.max(1, Math.min(Math.ceil(this.workFast / PostgreSQLPool.window * 1.5) + 1, size - Math.ceil(this.workSlow / PostgreSQLPool.window)));
    return heavy < size - reserve
      ? this.findSoonest(time, Infinity, false)
      : this.findSoonest(time, 2 * estimate, true) ?? this.findSoonest(time, Infinity, false);
  }

  private findSoonest(time: number, most: number, heavy: boolean): PostgreSQLConnection | null {
    let value = Infinity;
    let tied: PostgreSQLConnection[] = [];
    for (const connection of this.connections) {
      const wait = this.isUsable(connection) && connection.inflight < this.clientOptions.maxPipeline && (!heavy || connection.isHeavy())
        ? connection.computeBacklog(time)
        : Infinity;
      if (wait === Infinity || wait > most)
        continue;

      if (wait < value) {
        value = wait;
        tied = [connection];
      }
      else if (wait === value)
        tied.push(connection);
    }

    return tied[Math.floor(Math.random() * tied.length)] ?? null;
  }

  private decay(time: number): void {
    const factor = Math.exp((this.workAt - time) / PostgreSQLPool.window);
    this.workFast *= factor;
    this.workSlow *= factor;
    this.workAt = time;
  }

  private grow(): void {
    if (!Object.isNull(this.ending) && this.waiting.length === 0)
      return;

    if (!Object.isNull(this.failingSince)) {
      if (this.opening > 0 || this.waiting.length === 0 || !Object.isNull(this.retryTimer) || [...this.connections].some(connection => connection.loading))
        return;

      const wait = this.nextAttempt - this.timers.readTime();
      if (wait > 0)
        this.retryTimer = this.timers.setTimeout(() => {
          this.retryTimer = null;
          this.grow();
        }, wait);
      else
        this.connect();
      return;
    }

    let loading = 0;
    let idle = 0;
    for (const connection of this.connections)
      if (connection.loading)
        loading += 1;
      else if (!this.typesLoaded && this.isUsable(connection) && connection.inflight === 0)
        idle += 1;

    const max = this.clientOptions.max;
    const size = this.connections.size;
    const wanted = Math.max(
      Math.min(this.waiting.length - this.opening - loading - idle, max - size - this.opening),
      this.used && Object.isNull(this.ending) ? Math.min(this.clientOptions.min, max) - size - this.opening : 0);
    for (let index = 0; index < wanted; index += 1)
      this.connect();
  }

  private connect(): void {
    this.opening += 1;
    this.timers.clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.startAsync().then(session => this.handleOpened(session), (error: unknown) => this.handleOpenFailure(PostgreSQLPool.toError(error)));
  }

  private async startAsync(): Promise<StartedSession> {
    const starter = this.starter(this.connection);
    this.starting.add(starter);
    try {
      return await starter.startAsync();
    }
    finally {
      this.starting.delete(starter);
    }
  }

  private readFastFailure(): Error | null {
    return this.retries > 1 && this.opening === 0 && this.timers.readTime() < this.nextAttempt && this.isStuck() ? this.failure : null;
  }

  private isStuck(): boolean {
    for (const connection of this.connections)
      if (Object.isNull(connection.lease))
        return false;

    return true;
  }

  private handleOpened(session: StartedSession): void {
    this.opening -= 1;
    if (this.aborted || (!Object.isNull(this.ending) && this.waiting.length === 0)) {
      session.socket.destroy();
      this.finishEnding();
      return;
    }

    for (const [name, value] of session.parameters)
      this.onParameter(name, value);
    const connection = new PostgreSQLConnection(session, this.clientOptions, this);
    this.connections.add(connection);
    this.scheduleLifetime(connection);
    if (!this.typesLoaded && this.eager) {
      if (this.typesLoading)
        connection.loading = true;
      else
        this.loadTypes(connection);
    }

    if (!connection.loading && Object.isNull(connection.typing) && !(this.eager && this.typesLoading))
      this.markRecovered();
    this.drain();
  }

  private markRecovered(): void {
    this.retries = 0;
    this.failingSince = null;
    this.failure = null;
  }

  private async loadTypesSeparatelyAsync(): Promise<void> {
    this.separate = true;
    try {
      await this.loadWith(await this.startAsync());
    }
    finally {
      this.separate = false;
      this.loader = null;
    }
  }

  private loadWith(session: StartedSession): Promise<void> {
    const connection = new PostgreSQLConnection(session, this.clientOptions, new TypeLoaderEvents(this));
    this.loader = connection;
    return this.types.loadAsync(this.createRunner(connection, false)).finally(() => connection.closeAsync());
  }

  private watchTypeLoad(loading: Promise<void>): void {
    loading.then(() => {
      this.typesLoaded = true;
      return null;
    }, (error: unknown) => {
      if (!(error instanceof PostgreSQLException))
        return PostgreSQLPool.toError(error);

      this.typesLoaded = true;
      return null;
    }).then(failure => {
      this.handleTypesFetched(failure);
      this.finishEnding();
    });
  }

  private handleTypesFetched(failure: Error | null): void {
    this.typesLoading = false;
    this.isTyped = this.typesLoaded;
    if (this.typesLoaded) {
      this.typeRetries = 0;
      this.typesFailing = null;
      this.resume();
      return;
    }

    const now = this.timers.readTime();
    const failing = this.typesFailing ?? now;
    this.typesFailing = failing;
    this.typeRetries += 1;
    const timeout = this.connection.connectTimeout;
    if (timeout > 0 && now - failing >= timeout * 1000) {
      this.typeRetries = 0;
      this.typesFailing = null;
      for (const connection of [...this.paused]) {
        this.paused.delete(connection);
        connection.destroy(failure);
      }
      return;
    }

    if (this.paused.size > 0)
      this.retryTypes = this.timers.setTimeout(() => {
        this.retryTypes = null;
        this.requestTypes(null);
      }, 1000 * this.computeBackoff(this.typeRetries));
  }

  private resume(): void {
    const all = [...this.paused];
    this.paused.clear();
    for (const connection of all)
      if (Object.isNull(connection.closed))
        connection.go();
    this.drain();
  }

  private createRunner(connection: PostgreSQLConnection, typing: boolean): (text: string) => Promise<readonly unknown[]> {
    return async text => {
      const query = new Query(new BuiltQuery(text, [], []), this, new QueryOptions(true, false));
      query.executed = true;
      if (typing)
        connection.typing = query;
      this.armQueryTimeout(connection, query);
      connection.sendSimple(query, text);
      const outcome = await query.promise;
      return outcome instanceof Result ? outcome : [];
    };
  }

  private armQueryTimeout(connection: PostgreSQLConnection, query: Query): void {
    const seconds = this.clientOptions.queryTimeout;
    if (seconds <= 0)
      return;

    const timer = this.timers.setTimeout(() => {
      if (!query.settled)
        connection.cancelAsync(query).catch(PostgreSQLPool.ignore);
    }, seconds * 1000);
    query.promise.then(() => this.timers.clearTimeout(timer), () => this.timers.clearTimeout(timer));
  }

  private retype(): TypeNotFoundException | null {
    const error = this.typesError;
    if (Object.isNull(error))
      return null;
    if (this.timers.readTime() - this.typesFailed < PostgreSQLPool.retypeDelay)
      return error;

    this.typesError = null;
    for (const connection of this.connections)
      connection.loading = true;
    const first = [...this.connections].find(connection => Object.isNull(connection.closed));
    if (!Object.isUndefined(first))
      this.loadTypes(first);
    return null;
  }

  private loadTypes(connection: PostgreSQLConnection): void {
    this.hold(connection);
    this.typesLoading = true;
    connection.loading = this.types.named;
    connection.typing = null;
    this.types.loadAsync(this.createRunner(connection, !this.types.named)).then(() => {
      this.typesLoaded = true;
    }, (error: unknown) => {
      if (error instanceof PostgreSQLException)
        this.typesLoaded = true;
      else if (error instanceof TypeNotFoundException) {
        this.typesError = error;
        this.typesFailed = this.timers.readTime();
      }
    }).then(() => this.handleTypesSettled(connection));
  }

  private handleTypesSettled(connection: PostgreSQLConnection): void {
    this.typesLoading = false;
    this.isTyped = this.typesLoaded;
    connection.typing = null;
    const error = this.typesError;
    for (const item of this.connections)
      item.loading = !this.typesLoaded && Object.isNull(error);
    if (this.typesLoaded || !Object.isNull(error))
      this.markRecovered();

    if (!Object.isNull(error))
      for (const job of this.waiting.take())
        this.reject(job, error);
    else if (!this.typesLoaded) {
      const next = [...this.connections].find(item => Object.isNull(item.closed) && Object.isNull(item.typing));
      if (!Object.isUndefined(next))
        this.loadTypes(next);
    }

    this.drain();
  }

  private handleOpenFailure(error: Error): void {
    this.opening -= 1;
    if (this.aborted) {
      this.finishEnding();
      return;
    }

    this.recordFailedAttempt(error);
    if (Object.isNull(this.ending))
      this.grow();
    else
      this.finishEnding();
  }

  private recordFailedAttempt(error: Error): void {
    const now = this.timers.readTime();
    const since = this.failingSince ?? now;
    this.failingSince = since;
    this.retries += 1;
    this.nextAttempt = now + 1000 * this.computeBackoff(this.retries);

    const transient = (error instanceof ConnectionClosedException && !error.destroyed)
      || (error instanceof PostgreSQLException && error.sqlState === Resources.tooManyConnectionsState);
    const timeout = this.connection.connectTimeout;
    const expired = timeout > 0 && now - since >= timeout * 1000;
    this.failure = !transient || expired ? error : null;
    if (this.isStuck() && this.opening === 0 && (!Object.isNull(this.failure) || !Object.isNull(this.ending)))
      for (const job of this.waiting.take())
        this.reject(job, error);
  }

  private computeBackoff(retries: number): number {
    const backoff = this.clientOptions.backoff;
    return Object.isFunction(backoff) ? backoff(retries) : backoff;
  }

  private reject(job: PoolJob, error: Error): void {
    this.markStarted(job);
    job.fail(error);
  }

  private scheduleLifetime(connection: PostgreSQLConnection): void {
    const configured = this.clientOptions.maxLifetime;
    const life = Object.isFunction(configured) ? configured() : configured;
    if (!Object.isNull(life) && life > 0)
      connection.lifeTimer = this.unref(this.timers.setTimeout(() => {
        connection.retiring = true;
        if (connection.inflight === 0 && Object.isNull(connection.lease))
          connection.closeAsync();
      }, life * 1000));
    this.handleIdle(connection);
  }

  private handleIdle(connection: PostgreSQLConnection): void {
    if (connection.inflight > 0 || !Object.isNull(connection.lease))
      return;

    if (this.clientOptions.unrefSockets && !connection.loading && this.waiting.length === 0)
      connection.unref();
    const timeout = this.clientOptions.idleTimeout;
    if (Object.isNull(timeout) || timeout <= 0)
      return;

    connection.idleSince = this.timers.readTime();
    if (Object.isNull(connection.idleTimer))
      connection.idleTimer = this.unref(this.timers.setTimeout(() => this.handleIdleTimeout(connection, timeout), timeout * 1000));
  }

  private handleIdleTimeout(connection: PostgreSQLConnection, timeout: number): void {
    connection.idleTimer = null;
    if (connection.inflight > 0 || !Object.isNull(connection.lease) || !Object.isNull(connection.closed))
      return;
    if (this.connections.size <= this.clientOptions.min)
      return;

    const left = timeout * 1000 - (this.timers.readTime() - connection.idleSince);
    if (left >= 1)
      connection.idleTimer = this.unref(this.timers.setTimeout(() => this.handleIdleTimeout(connection, timeout), left));
    else
      connection.closeAsync();
  }

  private hold(connection: PostgreSQLConnection): void {
    if (this.clientOptions.unrefSockets)
      connection.ref();
  }

  private unref(timer: number): number {
    if (this.clientOptions.unrefSockets)
      this.timers.unref(timer);
    return timer;
  }

  private grant(connection: PostgreSQLConnection, kind: LeaseKind): PoolLease {
    this.timers.clearTimeout(connection.idleTimer);
    connection.idleTimer = null;
    const lease = new PoolLease(this, connection, kind);
    connection.lease = lease;
    return lease;
  }

  private finishEnding(): void {
    const ended = this.ended;
    if (Object.isNull(ended))
      return;

    if (this.waiting.length === 0)
      for (const connection of [...this.connections])
        if (connection.inflight === 0 && Object.isNull(connection.lease))
          connection.closeAsync();

    if (this.connections.size === 0 && this.opening === 0 && this.waiting.length > 0) {
      const error = this.createEndedError();
      for (const job of this.waiting.take())
        this.reject(job, error);
    }

    if (this.connections.size === 0 && (this.opening === 0 || this.aborted) && this.waiting.length === 0 && this.cancelling === 0 && !this.separate) {
      this.timers.clearTimeout(this.endTimer);
      this.timers.clearTimeout(this.retryTimer);
      this.timers.clearTimeout(this.retryTypes);
      this.ended = null;
      ended();
    }
  }

  private destroy(): void {
    this.endTimer = null;
    this.aborted = true;
    for (const starter of this.starting)
      starter.stop();
    const error = this.createDestroyedError();
    this.cancelAbort.abort(error);
    for (const job of this.waiting.take())
      this.reject(job, error);
    for (const connection of [...this.connections])
      connection.destroy();
    this.loader?.destroy();
    if (this.connections.size === 0)
      this.finishEnding();
  }

  private createEndedError(): ConnectionEndedException {
    return new ConnectionEndedException(this.connection.host, this.connection.port);
  }

  private createDestroyedError(): ConnectionClosedException {
    return new ConnectionClosedException(true, this.connection.host, this.connection.port, null);
  }

  private static isQuiet(connection: PostgreSQLConnection): boolean {
    return connection.inflight === 0 || (!Object.isNull(connection.typing) && !connection.typing.settled && connection.inflight === 1);
  }

  private static createLostError(connection: PostgreSQLConnection, error: ConnectionClosedException): Error {
    const cause = error.cause;
    if (cause instanceof PostgreSQLException && cause.severity === Resources.fatalSeverity && !connection.uncertain)
      return cause;

    return error.destroyed ? new ConnectionClosedException(false, connection.host, connection.port, null) : error;
  }

  private static ignore(): undefined {
    return undefined;
  }

  private static toError(error: unknown): Error {
    return error instanceof Error ? error : new DataException(Resources.nonErrorThrown, new ExceptionOptions(error));
  }
}
