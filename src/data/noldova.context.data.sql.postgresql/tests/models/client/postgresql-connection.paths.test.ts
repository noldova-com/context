/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";
import { Duplex, Readable, Writable } from "node:stream";
import { setImmediate } from "node:timers";

import { DataException } from "@noldova/context.data";
import { LeaseKind } from "@noldova/context.data.sql.postgresql/enums/lease-kind.js";
import { PreparedState } from "@noldova/context.data.sql.postgresql/enums/prepared-state.js";
import { CursorAction } from "@noldova/context.data.sql.postgresql/enums/cursor-action.js";
import { BatchException } from "@noldova/context.data.sql.postgresql/exceptions/batch.exception.js";
import { CancelUnansweredException } from "@noldova/context.data.sql.postgresql/exceptions/cancel-unanswered.exception.js";
import { ConnectionClosedException } from "@noldova/context.data.sql.postgresql/exceptions/connection-closed.exception.js";
import { PostgreSQLException } from "@noldova/context.data.sql.postgresql/exceptions/postgresql.exception.js";
import { QueryCanceledException } from "@noldova/context.data.sql.postgresql/exceptions/query-canceled.exception.js";
import { QueryCost } from "@noldova/context.data.sql.postgresql/models/query-cost.js";
import { QueryStatement } from "@noldova/context.data.sql.postgresql/models/query-statement.js";
import { Result } from "@noldova/context.data.sql.postgresql/models/result.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { BackendMessages as M } from "../../fixtures/backend-messages.fixture.js";
import { ConnectionHarness } from "../../fixtures/connection-harness.fixture.js";
import { FakeLease } from "../../fixtures/fake-lease.fixture.js";
import { FakeSocket } from "../../fixtures/fake-socket.fixture.js";

@TestClass
export class PostgreSQLConnectionPathTests {
  @TestMethod
  public async closesOnAFrameItCannotReadAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.unnamed("select 1");
    harness.connection.send(query);
    harness.written();
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, ConnectionClosedException);

    harness.receive(Buffer.from([0x44, 0, 0, 0, 1]));

    const error = await rejected;
    Assert.isTrue(harness.socket.destroyed);
    Assert.isInstanceOf(error.cause, DataException);
  }

  @TestMethod
  public async waitsForTheSocketToDrainDuringCopyInAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.plain("copy t from stdin");
    query.streaming = true;
    harness.connection.sendSimple(query, "copy t from stdin");
    harness.written();
    harness.receive(M.copyIn());
    const stream = await query;
    if (!(stream instanceof Writable))
      throw new TypeError("No writable stream.");
    harness.socket.accepts = false;
    const written: string[] = [];

    stream.write("1\n", () => written.push("first"));
    await harness.socket.waitForAsync(() => harness.socket.peek() === "d");
    const before = written.length;
    harness.socket.accepts = true;
    harness.socket.onDrain();
    await harness.socket.waitForAsync(() => written.length > 0);
    const finished = new Promise<void>(resolve => stream.once("finish", () => resolve()));
    stream.end();
    await harness.socket.waitForAsync(() => harness.socket.peek().endsWith("c"));
    harness.receive(M.commandComplete("COPY 1"), M.readyForQuery());
    await finished;

    Assert.areEqual(0, before);
    Assert.areEqual("first", written.join());
    Assert.areEqual("d,c", harness.socket.take());
  }

  @TestMethod
  public async failsACopyInDestroyedWithoutAnErrorAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.plain("copy t from stdin");
    query.streaming = true;
    harness.connection.sendSimple(query, "copy t from stdin");
    harness.written();
    harness.receive(M.copyIn());
    const stream = await query;
    if (!(stream instanceof Writable))
      throw new TypeError("No writable stream.");

    stream.destroy();
    await harness.socket.waitForAsync(() => harness.socket.peek() === "f");
    const sent = harness.socket.bytes().toString("utf8", 5);
    harness.receive(M.error("57014", "COPY from stdin failed"), M.readyForQuery());

    Assert.isTrue(sent.length > 1);
    Assert.areEqual(0, harness.connection.inflight);
  }

  @TestMethod
  public async pausesACopyOutTheReaderCannotKeepUpWithAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.plain("copy t to stdout");
    query.streaming = true;
    harness.connection.sendSimple(query, "copy t to stdout");
    harness.written();
    const big = "x".repeat(70000);

    harness.receive(M.copyOut(), M.copyData(big), M.copyData("y"));
    const stream = await query;
    if (!(stream instanceof Readable))
      throw new TypeError("No readable stream.");
    const paused = harness.socket.paused;
    const chunks: string[] = [];
    stream.on("data", (chunk: unknown) => chunks.push(String(chunk)));
    await harness.socket.waitForAsync(() => chunks.join("").length === big.length + 1);
    const resumed = !harness.socket.paused;
    const ended = new Promise<void>(resolve => stream.once("end", () => resolve()));
    harness.receive(M.copyDone(), M.commandComplete("COPY 2"), M.readyForQuery());
    await ended;

    Assert.isTrue(paused);
    Assert.isTrue(resumed);
  }

  @TestMethod
  public async resumesWhenAPausedCopyOutIsAbandonedAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.plain("copy t to stdout");
    query.streaming = true;
    harness.connection.sendSimple(query, "copy t to stdout");
    harness.written();

    harness.receive(M.copyOut(), M.copyData("x".repeat(70000)), M.copyData("y"));
    const stream = await query;
    if (!(stream instanceof Readable))
      throw new TypeError("No readable stream.");
    const paused = harness.socket.paused;
    stream.destroy();
    await harness.socket.waitForAsync(() => !harness.socket.paused);
    const resumed = !harness.socket.paused;
    harness.receive(M.copyData("z"), M.copyDone(), M.commandComplete("COPY 3"), M.readyForQuery());

    Assert.isTrue(paused);
    Assert.isTrue(resumed);
    Assert.areEqual(0, harness.connection.inflight);
  }

  @TestMethod
  public async cancelsABatchItIsRunningAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const parts = [harness.unnamed("select pg_sleep(10)"), harness.unnamed("select 2")];
    const batch = harness.plain("");
    batch.parts = parts;
    harness.connection.batch(batch, parts);
    harness.written();
    const rejected = Assert.throwsAsync(async () => {
      await batch;
    }, BatchException);

    await harness.connection.cancelAsync(batch);
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.error("57014", "canceling statement"), M.readyForQuery());

    const error = await rejected;
    Assert.areEqual(7, harness.starter.cancelled[0]?.pid);
    const waiting = harness.timers.scheduled;
    harness.timers.advance(5000);
    Assert.areEqual(0, error.index);
    Assert.areEqual(0, waiting);
    Assert.isFalse(harness.socket.destroyed);
  }

  @TestMethod
  public async destroysTheConnectionWhenABatchCancelIsUnansweredAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const parts = [harness.unnamed("select 1"), harness.unnamed("select pg_sleep(10)")];
    const batch = harness.plain("");
    batch.parts = parts;
    harness.connection.batch(batch, parts);
    harness.written();
    const settled = batch.then(() => null, (error: unknown) => error);

    await harness.connection.cancelAsync(batch);
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"));
    harness.timers.advance(5000);

    Assert.isInstanceOf(await settled, Error);
    Assert.isTrue(harness.socket.destroyed);
  }

  @TestMethod
  public async dropsTheCancelTimerOfABatchThatCompletesAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const parts = [harness.unnamed("select 1"), harness.unnamed("select 2")];
    const batch = harness.plain("");
    batch.parts = parts;
    harness.connection.batch(batch, parts);
    harness.written();

    await harness.connection.cancelAsync(batch);
    const waiting = harness.timers.scheduled;
    harness.receive(
      M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"),
      M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"),
      M.readyForQuery());
    await batch;

    Assert.areEqual(1, waiting);
    Assert.areEqual(0, harness.timers.scheduled);
    Assert.isFalse(harness.socket.destroyed);
  }

  @TestMethod
  public async leavesTheConnectionOpenWhenTheCancelledQueryHasAlreadySettledAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const head = harness.unnamed("select pg_sleep(10)");
    harness.connection.send(head);
    harness.written();
    const settled = head.then(() => null, (error: unknown) => error);

    await harness.connection.cancelAsync(head);
    const waiting = harness.timers.scheduled;
    head.reject(new Error("timed out"));
    await settled;
    harness.timers.advance(5000);

    Assert.areEqual(1, waiting);
    Assert.areEqual(1, harness.starter.cancelled.length);
    Assert.isFalse(harness.socket.destroyed);
  }

  @TestMethod
  public async cancelsABatchQueuedBehindAnotherQueryAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const head = harness.unnamed("select 1");
    const parts = [harness.unnamed("select pg_sleep(10)"), harness.unnamed("select 2")];
    const batch = harness.plain("");
    batch.parts = parts;
    harness.connection.send(head);
    harness.connection.batch(batch, parts);
    harness.written();
    const rejected = Assert.throwsAsync(async () => {
      await batch;
    }, BatchException);

    const cancelled = harness.connection.cancelAsync(batch);
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery());
    harness.timers.tick();
    await cancelled;
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.error("57014", "canceling statement"), M.readyForQuery());

    await head;
    Assert.areEqual(0, (await rejected).index);
    Assert.areEqual(1, harness.starter.cancelled.length);
  }

  @TestMethod
  public async cancelsABatchWaitingBehindACursorAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const cursor = harness.unnamed("select x from t").useCursor(1, () => undefined);
    const parts = [harness.unnamed("select 1"), harness.unnamed("select 2")];
    const batch = harness.plain("");
    batch.parts = parts;
    harness.connection.send(cursor);
    harness.connection.batch(batch, parts);
    Assert.areEqual("P,D,B,E,H", harness.written());
    const rejected = Assert.throwsAsync(async () => {
      await batch;
    }, BatchException);

    await harness.connection.cancelAsync(batch);
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]), M.commandComplete("SELECT 1"));
    const synced = harness.written();
    harness.receive(M.readyForQuery());
    await cursor;
    harness.receive(M.error("42601", "syntax error"), M.readyForQuery());

    const error = await rejected;
    Assert.isInstanceOf(error.cause, QueryCanceledException);
    Assert.areEqual("S,P,S", synced);
  }

  @TestMethod
  public async cancelsAQueryWhileItWaitsForTypesAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    harness.events.isTyped = false;
    harness.events.unknownTypes = true;
    const query = harness.unnamed("select $1::int as x", [1], [23]);
    harness.connection.send(query);
    harness.written();
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, QueryCanceledException);

    harness.receive(M.parseComplete(), M.parameterDescription([23]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]), M.commandComplete("SELECT 1"), M.readyForQuery());
    harness.events.unknownTypes = false;
    await harness.connection.cancelAsync(query);

    await rejected;
    harness.connection.go();
    Assert.areEqual(0, harness.connection.inflight);
  }

  @TestMethod
  public async cancelsAFlushingCursorWhileItsCallbackRunsAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    let release = (): void => undefined;
    const query = harness.unnamed("select x from t").useCursor(1, () => new Promise<void>(resolve => {
      release = resolve;
    }));
    harness.connection.send(query);
    harness.written();
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, QueryCanceledException);

    harness.receive(M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]), M.portalSuspended());
    await harness.connection.cancelAsync(query);
    release();
    Assert.areEqual("S", await harness.writtenAsync());
    harness.receive(M.readyForQuery());

    await rejected;
    Assert.areEqual(0, harness.starter.cancelled.length);
  }

  @TestMethod
  public async cancelsATransactionCursorWhileItsCallbackRunsAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    harness.connection.lease = new FakeLease(LeaseKind.Transaction);
    let release = (): void => undefined;
    const query = harness.unnamed("select x from t").useCursor(1, () => new Promise<void>(resolve => {
      release = resolve;
    }));
    harness.connection.send(query);
    harness.written();
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, QueryCanceledException);

    harness.receive(M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]), M.portalSuspended(), M.readyForQuery("T"));
    await harness.connection.cancelAsync(query);
    release();
    Assert.areEqual("C,S", await harness.writtenAsync());
    harness.receive(M.message("3"), M.readyForQuery("T"));

    await rejected;
  }

  @TestMethod
  public async cancelsAQueuedQueryInFrontOfAFenceAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    harness.connection.lease = new FakeLease(LeaseKind.Transaction);
    const cursor = harness.unnamed("select x from t").useCursor(1, () => undefined);
    const blocked = harness.unnamed("select 1");
    blocked.cost = new QueryCost(200);
    const commit = harness.plain("commit");
    const after = harness.unnamed("select 2");

    harness.connection.send(cursor);
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]), M.portalSuspended(), M.readyForQuery("T"));
    harness.connection.send(blocked);
    harness.connection.sendSimple(commit, "commit");
    harness.connection.send(after);
    const heavy = harness.connection.isHeavy();
    const rejected = Assert.throwsAsync(async () => {
      await commit;
    }, QueryCanceledException);
    await harness.connection.cancelAsync(commit);
    await rejected;

    Assert.isTrue(heavy);
    Assert.isTrue(harness.connection.computeBacklog(0) >= 200);
  }

  @TestMethod
  public async ignoresACancelOfAQueryItNeverSawAsync(): Promise<void> {
    const harness = new ConnectionHarness();

    await harness.connection.cancelAsync(harness.unnamed("select 1"));
    harness.connection.go();

    Assert.areEqual(0, harness.connection.inflight);
    Assert.areEqual(0, harness.starter.cancelled.length);
  }

  @TestMethod
  public async waitsForTheReadyAnswerOfACompletedQueryItCancelsAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.unnamed("select 1");
    harness.connection.send(query);
    harness.written();

    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"));
    await harness.connection.cancelAsync(query);
    const waiting = harness.timers.scheduled;
    harness.receive(M.readyForQuery());
    await query;

    Assert.areEqual(1, waiting);
    Assert.areEqual(0, harness.timers.scheduled);
    Assert.areEqual(0, harness.starter.cancelled.length);
  }

  @TestMethod
  public async cancelsADescribeItIsRunningAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.unnamed("select $1");
    const described = harness.connection.describeAsync("select $1", [], query);
    harness.written();
    const rejected = Assert.throwsAsync(() => described, PostgreSQLException);

    await harness.connection.cancelAsync(query);
    harness.receive(M.error("57014", "canceling statement"), M.readyForQuery());

    await rejected;
    Assert.areEqual(1, harness.starter.cancelled.length);
  }

  @TestMethod
  public async measuresTheBacklogOfQueriesWithoutACostAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const cursor = harness.unnamed("select x from t").useCursor(1, () => undefined);
    const waiting = harness.unnamed("select 1");

    harness.connection.send(cursor);
    harness.connection.send(waiting);
    harness.timers.advance(30);
    const backlog = harness.connection.computeBacklog(30);
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.commandComplete("SELECT 0"));
    harness.timers.tick();
    harness.receive(M.readyForQuery());
    harness.timers.tick();
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery());
    await cursor;
    await waiting;

    Assert.areEqual(30, backlog);
  }

  @TestMethod
  public async copiesBothWaysAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.plain("start_replication");
    query.streaming = true;
    harness.connection.sendSimple(query, "start_replication");
    harness.written();

    harness.receive(M.message("W", Buffer.from([0, 0, 0])), M.copyData("w"));
    const stream = await query;
    if (!(stream instanceof Duplex))
      throw new TypeError("No duplex stream.");
    const chunks: string[] = [];
    stream.on("data", (chunk: unknown) => chunks.push(String(chunk)));
    const finished = new Promise<void>(resolve => stream.once("finish", () => resolve()));
    stream.end("r");
    await harness.socket.waitForAsync(() => harness.socket.peek().endsWith("c"));
    const written = harness.socket.take();
    harness.receive(M.copyDone(), M.commandComplete("COPY 0"), M.readyForQuery());
    await finished;

    Assert.areEqual("w", chunks.join(""));
    Assert.areEqual("d,c", written);
  }

  @TestMethod
  public async failsTheHeadOnAFunctionCallAnswerAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.unnamed("select 1");
    harness.connection.send(query);
    harness.written();
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, DataException);

    harness.receive(M.message("V", Buffer.from([0, 0, 0, 0])));
    harness.receive(M.readyForQuery());
    harness.receive(M.message("v", Buffer.from([0, 0, 0, 0])));

    Assert.isTrue((await rejected).message.length > 0);
    Assert.isFalse(harness.socket.destroyed);
  }

  @TestMethod
  public async destroysTheConnectionOnARowNoQueryAwaitsAsync(): Promise<void> {
    const harness = new ConnectionHarness();

    harness.receive(M.dataRow(["1"]));

    Assert.isTrue(harness.socket.destroyed);
    Assert.isInstanceOf(harness.events.closes[0]?.cause, DataException);
  }

  @TestMethod
  public async settlesEverythingItHeldWhenTheSocketClosesAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    harness.connection.lease = new FakeLease(LeaseKind.Transaction);
    let release = (): void => undefined;
    const cursor = harness.unnamed("select x from t").useCursor(1, () => new Promise<void>(resolve => {
      release = resolve;
    }));
    harness.connection.send(cursor);
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]), M.portalSuspended(), M.readyForQuery("T"));
    const head = harness.unnamed("select pg_sleep(1)");
    const queued = harness.unnamed("select 2");
    const describing = harness.unnamed("select $1");
    harness.connection.send(head);
    harness.connection.send(queued);
    const described = harness.connection.describeAsync("select $1", [], describing);
    const cancelled = harness.connection.cancelAsync(queued);
    const failures = Promise.all([
      Assert.throwsAsync(async () => {
        await cursor;
      }, ConnectionClosedException),
      Assert.throwsAsync(async () => {
        await head;
      }, ConnectionClosedException),
      Assert.throwsAsync(async () => {
        await queued;
      }, ConnectionClosedException),
      Assert.throwsAsync(() => described, ConnectionClosedException)
    ]);

    harness.socket.close(null);
    harness.socket.close(null);
    release();
    await cancelled;
    await failures;
    await harness.connection.closeAsync();

    Assert.areEqual(1, harness.events.closes.length);
  }

  @TestMethod
  public async logsANoticeWithoutAHandlerAndIgnoresOneWhenAskedAsync(): Promise<void> {
    const logged: unknown[] = [];
    const log = console.log;
    console.log = (...values: unknown[]): void => {
      logged.push(...values);
    };
    try {
      new ConnectionHarness({ onnotice: null }).receive(M.notice("look"));
      new ConnectionHarness({ onnotice: false }).receive(M.notice("quiet"));
    }
    finally {
      console.log = log;
    }

    Assert.areEqual(1, logged.length);
    Assert.isTrue(JSON.stringify(logged[0]).includes("look"));
  }

  @TestMethod
  public async rollsBackAndRefusesQueriesBehindAnUnsafeTransactionAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const begin = harness.plain("begin");
    const broken = harness.unnamed("select $1::int4", [1, 2], [23]);
    const behind = harness.unnamed("select 3");

    harness.connection.sendSimple(begin, "begin");
    harness.connection.send(broken);
    harness.connection.send(behind);
    harness.written();
    const failures = Promise.all([
      Assert.throwsAsync(async () => {
        await begin;
      }, Error),
      Assert.throwsAsync(async () => {
        await broken;
      }, Error),
      Assert.throwsAsync(async () => {
        await behind;
      }, Error)
    ]);
    harness.receive(M.commandComplete("BEGIN"), M.readyForQuery("T"));
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery("T"));
    harness.receive(M.commandComplete("ROLLBACK"), M.readyForQuery());

    const [first, second, third] = await failures;
    Assert.areEqual("UnsafeTransactionException", first.constructor.name);
    Assert.areEqual("DataException", second.constructor.name);
    Assert.areEqual("UnsafeTransactionException", third.constructor.name);
  }

  @TestMethod
  public async holdsAQueryBehindALooseStatementInABatchAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const statement = new QueryStatement("s1", "select $1 as x");
    const parts = [harness.query(statement, [1], [0]), harness.query(statement, [2], [0])];
    const batch = harness.plain("");
    batch.parts = parts;

    harness.connection.batch(batch, parts);
    const first = harness.written();
    harness.receive(M.parseComplete(), M.parameterDescription([23]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]), M.commandComplete("SELECT 1"));
    const second = harness.written();
    harness.receive(M.bindComplete(), M.dataRow(["2"]), M.commandComplete("SELECT 1"), M.readyForQuery());

    Assert.areEqual("[[{\"x\":1}],[{\"x\":2}]]", JSON.stringify(await batch));
    Assert.areEqual("P,D,B,E,H", first);
    Assert.areEqual("B,E,S", second);
  }

  @TestMethod
  public async readsACopyOutItsReaderAskedForFirstAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.plain("copy t to stdout");
    query.streaming = true;
    harness.connection.sendSimple(query, "copy t to stdout");
    harness.written();
    harness.receive(M.copyOut());
    const stream = await query;
    if (!(stream instanceof Readable))
      throw new TypeError("No readable stream.");
    const chunks: string[] = [];
    stream.on("data", (chunk: unknown) => chunks.push(String(chunk)));
    await harness.socket.waitForAsync(() => false);

    harness.receive(M.copyData("a"));
    stream.destroy();
    harness.receive(M.copyData("b"), M.copyDone(), M.commandComplete("COPY 2"), M.readyForQuery());

    Assert.areEqual("a", chunks.join(""));
    Assert.isFalse(harness.socket.paused);
    Assert.areEqual(0, harness.connection.inflight);
  }

  @TestMethod
  public async copiesCopyDataOutOfASharedBufferAsync(): Promise<void> {
    const harness = new ConnectionHarness({}, Buffer.alloc(0), new FakeSocket(true));
    const query = harness.plain("copy t to stdout");
    query.streaming = true;
    harness.connection.sendSimple(query, "copy t to stdout");
    harness.written();

    harness.receive(M.copyOut(), M.copyData("a"), M.copyData("b"), M.copyDone(), M.commandComplete("COPY 2"), M.readyForQuery());
    const stream = await query;
    if (!(stream instanceof Readable))
      throw new TypeError("No readable stream.");
    const chunks: string[] = [];
    for await (const chunk of stream)
      chunks.push(String(chunk));

    Assert.areEqual("ab", chunks.join(""));
  }

  @TestMethod
  public async settlesAQueryItCouldNotWriteAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const alone = harness.unnamed("select $1::int4", [1, 2], [23]);
    alone.cost = new QueryCost(200);
    const head = harness.unnamed("select 1");
    const behind = harness.unnamed("select $1::int4", [1, 2], [23]);
    const many = harness.unnamed("select 1", Array.from({ length: 70000 }, () => 1), Array.from({ length: 70000 }, () => 23));

    harness.connection.send(alone);
    const notable = harness.connection.notable;
    const first = await Assert.throwsAsync(async () => {
      await alone;
    }, DataException);
    harness.connection.send(head);
    harness.connection.send(behind);
    harness.connection.send(many);
    const written = harness.written();
    const rejected = Promise.all([
      Assert.throwsAsync(async () => {
        await behind;
      }, DataException),
      Assert.throwsAsync(async () => {
        await many;
      }, RangeError)
    ]);
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery());
    await head;
    await rejected;

    Assert.isFalse(notable);
    Assert.isTrue(first.message.length > 0);
    Assert.areEqual("P,D,B,E,S", written);
  }

  @TestMethod
  public async freesTheBatchItWasBlockedByAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const parts = [harness.unnamed("select 1"), harness.unnamed("select 2")];
    const first = parts[0];
    if (Object.isUndefined(first))
      throw new TypeError("No part.");
    first.alone = true;
    const batch = harness.plain("");
    batch.parts = parts;

    harness.connection.batch(batch, parts);
    const before = harness.written();
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"));
    const after = harness.written();
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery());

    Assert.areEqual(2, PostgreSQLConnectionPathTests.count(await batch));
    Assert.areEqual("P,D,B,E", before);
    Assert.areEqual("P,D,B,E,S", after);
  }

  @TestMethod
  public async dropsTheRestOfABatchWhenAPartFailsAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const statement = new QueryStatement("s9", "select 2");
    const failing = harness.unnamed("select 1 / 0");
    const blocking = harness.query(statement, [], []);
    blocking.alone = true;
    blocking.cost = new QueryCost(200);
    const parts = [failing, blocking, harness.unnamed("select 3")];
    const batch = harness.plain("");
    batch.parts = parts;

    harness.connection.batch(batch, parts);
    const written = harness.written();
    const rejected = Assert.throwsAsync(async () => {
      await batch;
    }, BatchException);
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.error("22012", "division by zero"));
    const synced = harness.written();
    harness.receive(M.readyForQuery());

    const error = await rejected;
    Assert.areEqual(0, error.index);
    Assert.areEqual("P,D,B,E,P,D,B,E", written);
    Assert.areEqual("S", synced);
    Assert.isFalse(harness.connection.notable);
    Assert.areEqual(PreparedState.Stale, harness.connection.prepared.get("s9")?.state);
  }

  @TestMethod
  public async runsAnEmptyPartOfABatchAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const parts = [harness.unnamed(""), harness.unnamed("select 1")];
    const batch = harness.plain("");
    batch.parts = parts;

    harness.connection.batch(batch, parts);
    harness.written();
    harness.receive(
      M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.emptyQuery(),
      M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery());

    Assert.areEqual(2, PostgreSQLConnectionPathTests.count(await batch));
  }

  @TestMethod
  public async keepsWaitingWithoutACancelTimeoutAsync(): Promise<void> {
    const harness = new ConnectionHarness({ cancelTimeout: 0 });
    const head = harness.unnamed("select 1");
    const queued = harness.unnamed("select pg_sleep(10)");
    harness.connection.send(head);
    harness.connection.send(queued);
    harness.written();
    const rejected = Assert.throwsAsync(async () => {
      await queued;
    }, PostgreSQLException);

    const cancelled = harness.connection.cancelAsync(queued);
    const scheduled = harness.timers.scheduled;
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery());
    harness.timers.tick();
    await cancelled;
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.error("57014", "canceling statement"), M.readyForQuery());

    await rejected;
    Assert.areEqual(0, scheduled);
    Assert.areEqual(0, harness.timers.scheduled);
    Assert.areEqual(1, harness.starter.cancelled.length);
  }

  @TestMethod
  public async destroysAConnectionThatStaysSilentAfterACancelAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const head = harness.unnamed("select pg_sleep(10)");
    const queued = harness.unnamed("select 2");
    harness.connection.send(head);
    harness.connection.send(queued);
    harness.written();
    const rejected = Assert.throwsAsync(async () => {
      await queued;
    }, ConnectionClosedException);
    const headRejected = Assert.throwsAsync(async () => {
      await head;
    }, ConnectionClosedException);

    const cancelled = harness.connection.cancelAsync(queued);
    harness.timers.advance(3000);
    harness.receive(M.parameterStatus("TimeZone", "UTC"));
    harness.timers.advance(2000);
    const alive = !harness.socket.destroyed;
    harness.timers.advance(3000);
    await cancelled;

    const error = await rejected;
    await headRejected;
    Assert.isTrue(alive);
    Assert.isTrue(harness.socket.destroyed);
    Assert.isInstanceOf(error.cause, CancelUnansweredException);
  }

  @TestMethod
  public async resolvesACancelWhoseTurnCameAfterTheCloseAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const head = harness.unnamed("select 1");
    const queued = harness.unnamed("select 2");
    harness.connection.send(head);
    harness.connection.send(queued);
    harness.written();
    const rejected = Assert.throwsAsync(async () => {
      await queued;
    }, ConnectionClosedException);

    const cancelled = harness.connection.cancelAsync(queued);
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery());
    harness.socket.close(null);
    harness.timers.tick();
    await cancelled;

    await head;
    await rejected;
    Assert.areEqual(0, harness.starter.cancelled.length);
  }

  @TestMethod
  public async waitsForTheReadyAnswerWhenTheCancelledQueryCompletedFirstAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const head = harness.unnamed("select 1");
    const queued = harness.unnamed("select 2");
    harness.connection.send(head);
    harness.connection.send(queued);
    harness.written();

    const cancelled = harness.connection.cancelAsync(queued);
    harness.receive(
      M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery(),
      M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"));
    harness.timers.tick();
    await cancelled;
    harness.receive(M.readyForQuery());

    await queued;
    Assert.areEqual(0, harness.starter.cancelled.length);
  }

  @TestMethod
  public async rejectsACancelTheServerCouldNotReceiveAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    harness.starter.failure = new RangeError("unreachable");
    const head = harness.unnamed("select 1");
    const queued = harness.unnamed("select 2");
    harness.connection.send(head);
    harness.connection.send(queued);
    harness.written();

    const cancelled = Assert.throwsAsync(() => harness.connection.cancelAsync(queued), RangeError);
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery());
    harness.timers.tick();
    const error = await cancelled;
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery());

    await queued;
    Assert.areEqual("unreachable", error.message);
  }

  @TestMethod
  public async destroysTheConnectionWhenADescribeCancelIsUnansweredAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.unnamed("select $1");
    const described = harness.connection.describeAsync("select $1", [], query);
    harness.written();
    const rejected = Assert.throwsAsync(() => described, ConnectionClosedException);

    await harness.connection.cancelAsync(query);
    harness.timers.advance(5000);

    Assert.isInstanceOf((await rejected).cause, CancelUnansweredException);
  }

  @TestMethod
  public async settlesWhatItHeldWhenItClosesDuringACopyAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const copy = harness.plain("copy t from stdin");
    copy.streaming = true;
    harness.connection.sendSimple(copy, "copy t from stdin");
    harness.receive(M.copyIn());
    const stream = await copy;
    if (!(stream instanceof Writable))
      throw new TypeError("No writable stream.");
    const failed = new Promise<unknown>(resolve => stream.once("error", resolve));

    harness.socket.close(null);

    Assert.isInstanceOf(await failed, ConnectionClosedException);
  }

  @TestMethod
  public async settlesQueriesItHeldBackWhenItClosesAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const cursor = harness.unnamed("select x from t").useCursor(1, () => undefined);
    const broken = harness.unnamed("select $1::int4", [1, 2], [23]);
    const waiting = harness.unnamed("select 2");
    const parts = [harness.unnamed("select 3"), harness.unnamed("select 4")];
    const batch = harness.plain("");
    batch.parts = parts;
    harness.connection.send(cursor);
    harness.connection.send(broken);
    harness.connection.send(waiting);
    harness.connection.batch(batch, parts);
    await harness.connection.cancelAsync(batch);
    const failures = Promise.all([
      Assert.throwsAsync(async () => {
        await cursor;
      }, ConnectionClosedException),
      Assert.throwsAsync(async () => {
        await broken;
      }, DataException),
      Assert.throwsAsync(async () => {
        await waiting;
      }, ConnectionClosedException),
      Assert.throwsAsync(async () => {
        await batch;
      }, BatchException)
    ]);

    harness.socket.close(null);

    const [, , , batchError] = await failures;
    Assert.isInstanceOf(batchError.cause, QueryCanceledException);
  }

  @TestMethod
  public async failsTheHeadWhenAMessageDoesNotFitItAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.unnamed("select $1");
    const described = harness.connection.describeAsync("select $1", [], query);
    harness.written();
    const rejected = Assert.throwsAsync(() => described, DataException);

    harness.receive(M.dataRow(["1"]));
    harness.receive(M.readyForQuery());
    await rejected;
    harness.receive(M.readyForQuery());

    Assert.isTrue(harness.socket.destroyed);
  }

  @TestMethod
  public async stopsAFlushingCursorWhoseConnectionClosedAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const releases: (() => void)[] = [];
    const resolving = harness.unnamed("select x from t").useCursor(1, () => new Promise<void>(resolve => {
      releases.push(resolve);
    }));
    harness.connection.send(resolving);
    harness.written();
    const rejected = Assert.throwsAsync(async () => {
      await resolving;
    }, ConnectionClosedException);

    harness.receive(M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]), M.portalSuspended());
    harness.socket.close(null);
    releases[0]?.();
    await rejected;

    const other = new ConnectionHarness();
    let reject = (_error: Error): void => undefined;
    const rejecting = other.unnamed("select x from t").useCursor(1, () => new Promise<void>((_resolve, fail) => {
      reject = fail;
    }));
    other.connection.send(rejecting);
    other.written();
    const otherRejected = Assert.throwsAsync(async () => {
      await rejecting;
    }, ConnectionClosedException);
    other.receive(M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]), M.portalSuspended());
    other.socket.close(null);
    reject(new RangeError("late"));
    await otherRejected;

    Assert.areEqual("", other.written());
  }

  @TestMethod
  public async wrapsAValueACursorRejectsWithAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.unnamed("select x from t").useCursor(1, () => ({
      then: (_resolve: (value: unknown) => void, reject: (reason: unknown) => void): void => {
        reject(5);
      }
    }));
    harness.connection.send(query);
    harness.written();
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, DataException);

    harness.receive(M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]), M.portalSuspended());
    Assert.areEqual("S", await harness.writtenAsync());
    harness.receive(M.readyForQuery());

    Assert.isTrue((await rejected).message.length > 0);
  }

  @TestMethod
  public async rejectsACursorWhoseLastBatchFailsAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.unnamed("select x from t").useCursor(10, () => {
      throw new RangeError("last");
    });
    harness.connection.send(query);
    harness.written();
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, RangeError);

    harness.receive(M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]), M.dataRow(["2"]), M.commandComplete("SELECT 2"));
    const synced = harness.written();
    harness.receive(M.readyForQuery());

    Assert.areEqual("last", (await rejected).message);
    Assert.areEqual("S", synced);
  }

  @TestMethod
  public async destroysCopyStreamsOnAServerErrorAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const open = harness.plain("copy t from stdin");
    open.streaming = true;
    harness.connection.sendSimple(open, "copy t from stdin");
    harness.receive(M.copyIn());
    const stream = await open;
    if (!(stream instanceof Writable))
      throw new TypeError("No writable stream.");
    const failed = new Promise<unknown>(resolve => stream.once("error", resolve));

    harness.receive(M.error("22P02", "invalid input"));
    harness.receive(M.readyForQuery());
    const error = await failed;

    const ending = harness.plain("copy t from stdin");
    ending.streaming = true;
    harness.connection.sendSimple(ending, "copy t from stdin");
    harness.receive(M.copyIn());
    const other = await ending;
    if (!(other instanceof Writable))
      throw new TypeError("No writable stream.");
    const ended = new Promise<unknown>(resolve => {
      other.once("error", resolve);
    });
    other.end("1\n");
    await harness.socket.waitForAsync(() => harness.socket.peek().endsWith("c"));
    harness.receive(M.error("22P02", "invalid input"), M.readyForQuery());

    Assert.isInstanceOf(error, PostgreSQLException);
    Assert.isInstanceOf(await ended, PostgreSQLException);
  }

  @TestMethod
  public async endsAfterTheLastAnswerWhenAskedToCloseAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.unnamed("select 1");
    harness.connection.send(query);
    harness.written();

    const closed = harness.connection.closeAsync();
    const again = harness.connection.closeAsync();
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery());
    await closed;

    Assert.areEqual(closed, again);
    Assert.isNotNull(harness.socket.ended);
  }

  @TestMethod
  public async keepsAFailedStatementNameInsideATransactionAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    harness.connection.lease = new FakeLease(LeaseKind.Transaction);
    const statement = new QueryStatement("s1", "select 1 as x");
    const query = harness.query(statement, [], []);
    await PostgreSQLConnectionPathTests.statusAsync(harness, "begin", "T");
    harness.connection.send(query);
    harness.written();
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, PostgreSQLException);

    harness.receive(M.error("42P05", "prepared statement already exists"), M.readyForQuery("E"));

    Assert.areEqual("42P05", (await rejected).sqlState);
    Assert.areNotEqual("s1", statement.name);
  }

  @TestMethod
  public async retriesAForgottenStatementOnlyWhenItCanAsync(): Promise<void> {
    const pipelined = new ConnectionHarness();
    const statement = new QueryStatement("s1", "select 1 as x");
    const ready = pipelined.query(statement, [], []);
    pipelined.connection.send(ready);
    pipelined.written();
    pipelined.receive(M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]), M.commandComplete("SELECT 1"), M.readyForQuery());
    await ready;
    const forgotten = pipelined.query(statement, [], []);
    const behind = pipelined.unnamed("select 2");
    pipelined.connection.send(forgotten);
    pipelined.connection.send(behind);
    const first = pipelined.written();
    pipelined.receive(M.error("26000", "prepared statement does not exist"), M.readyForQuery());
    const retried = pipelined.written();
    pipelined.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery());
    pipelined.receive(M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]));
    const run = pipelined.written();
    pipelined.receive(M.bindComplete(), M.dataRow(["1"]), M.commandComplete("SELECT 1"), M.readyForQuery());

    Assert.areEqual("[{\"x\":1}]", JSON.stringify(await forgotten));
    await behind;
    Assert.areEqual("B,E,S,P,D,B,E,S", first);
    Assert.areEqual("P,D,H", retried);
    Assert.areEqual("B,E,S", run);

    const single = new ConnectionHarness({ max: 1 });
    const own = new QueryStatement("s2", "select 1 as x");
    const warm = single.query(own, [], []);
    single.connection.send(warm);
    single.receive(M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]), M.commandComplete("SELECT 1"), M.readyForQuery());
    await warm;
    const lost = single.query(own, [], []);
    single.connection.send(lost);
    single.connection.send(single.unnamed("select 2"));
    const refused = Assert.throwsAsync(async () => {
      await lost;
    }, PostgreSQLException);
    single.receive(M.error("26000", "prepared statement does not exist"), M.readyForQuery());
    Assert.areEqual("26000", (await refused).sqlState);

    const transaction = new ConnectionHarness();
    const kept = new QueryStatement("s3", "select 1 as x");
    const opened = transaction.query(kept, [], []);
    transaction.connection.send(opened);
    transaction.receive(M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]), M.commandComplete("SELECT 1"), M.readyForQuery());
    await opened;
    transaction.connection.lease = new FakeLease(LeaseKind.Transaction);
    await PostgreSQLConnectionPathTests.statusAsync(transaction, "begin", "T");
    const inside = transaction.query(kept, [], []);
    transaction.connection.send(inside);
    const failed = Assert.throwsAsync(async () => {
      await inside;
    }, PostgreSQLException);
    transaction.receive(M.error("26000", "prepared statement does not exist"), M.readyForQuery("E"));
    Assert.areEqual("26000", (await failed).sqlState);
  }

  @TestMethod
  public async closesAndReparsesAStaleStatementWithANewShapeAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const statement = new QueryStatement("s1", "select $1::int4 as x");
    const first = harness.query(statement, [1], [23]);
    harness.connection.send(first);
    harness.written();
    harness.receive(M.parseComplete(), M.parameterDescription([23]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]), M.commandComplete("SELECT 1"), M.readyForQuery());
    await first;

    harness.connection.lease = new FakeLease(LeaseKind.Transaction);
    await PostgreSQLConnectionPathTests.statusAsync(harness, "begin", "T");
    const failing = harness.query(statement, [2], [23]);
    harness.connection.send(failing);
    harness.written();
    const rejected = Assert.throwsAsync(async () => {
      await failing;
    }, PostgreSQLException);
    harness.receive(M.error("22P02", "invalid input"), M.readyForQuery("E"));
    await rejected;
    await PostgreSQLConnectionPathTests.statusAsync(harness, "rollback", "I");
    harness.connection.lease = null;

    const again = harness.query(statement, [3], [23]);
    harness.connection.send(again);
    const written = harness.written();
    harness.receive(M.message("3"), M.parseComplete(), M.parameterDescription([23]), M.rowDescription([["x", 25]]), M.bindComplete(), M.dataRow(["3"]), M.commandComplete("SELECT 1"), M.readyForQuery());

    Assert.areEqual("[{\"x\":\"3\"}]", JSON.stringify(await again));
    Assert.areEqual("C,P,D,B,E,S", written);
    Assert.areEqual(1, statement.version);
  }

  @TestMethod
  public async rejectsACursorStepThatOutlivedItsTransactionAsync(): Promise<void> {
    const outcomes: string[] = [];
    for (const action of ["next", "close", "throw"]) {
      const harness = new ConnectionHarness();
      harness.connection.lease = new FakeLease(LeaseKind.Transaction);
      let release = (): void => undefined;
      const query = harness.unnamed("select x from t").useCursor(1, () => new Promise<unknown>((resolve, reject) => {
        release = (): void => {
          if (action === "throw")
            reject(new RangeError("thrown"));
          else
            resolve(action === "close" ? CursorAction.Close : undefined);
        };
      }));
      harness.connection.send(query);
      harness.written();
      harness.receive(M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]), M.portalSuspended(), M.readyForQuery("T"));
      harness.connection.lease = new FakeLease(LeaseKind.Transaction);
      release();
      outcomes.push(await query.then(() => "resolved", (error: unknown) => error instanceof Error ? error.constructor.name : "other"));
    }

    Assert.areEqual("UnsafeTransactionException,resolved,RangeError", outcomes.join());
  }

  @TestMethod
  public async ignoresACursorFailureAfterItsQueryClosedAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    harness.connection.lease = new FakeLease(LeaseKind.Transaction);
    let reject = (_error: Error): void => undefined;
    const query = harness.unnamed("select x from t").useCursor(1, () => new Promise<void>((_resolve, fail) => {
      reject = fail;
    }));
    harness.connection.send(query);
    harness.written();
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, ConnectionClosedException);
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]), M.portalSuspended(), M.readyForQuery("T"));

    harness.socket.close(null);
    reject(new RangeError("late"));
    await rejected;

    Assert.areEqual("", harness.written());
  }

  @TestMethod
  public async cancelsWorkQueuedBehindAFlushingCursorAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const cursor = harness.unnamed("select x from t").useCursor(1, () => undefined);
    const slow = harness.unnamed("select 1");
    slow.cost = new QueryCost(200);
    const describing = harness.unnamed("select $1");

    harness.connection.send(cursor);
    harness.connection.send(slow);
    const described = harness.connection.describeAsync("select $1", [], describing);
    const written = harness.written();
    const heavy = harness.connection.isHeavy();
    const rejected = Promise.all([
      Assert.throwsAsync(async () => {
        await slow;
      }, QueryCanceledException),
      Assert.throwsAsync(() => described, QueryCanceledException)
    ]);
    await harness.connection.cancelAsync(slow);
    await harness.connection.cancelAsync(describing);
    await rejected;

    Assert.areEqual("P,D,B,E,H", written);
    Assert.isTrue(heavy);
    Assert.isFalse(harness.connection.isHeavy());
    Assert.isFalse(harness.connection.notable);
    Assert.areEqual(1, harness.connection.inflight);
  }

  @TestMethod
  public async keepsOtherQueriesWhenItDropsTheRestOfABatchAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const parts = [harness.unnamed("select 1 / 0"), harness.unnamed("select 2")];
    const batch = harness.plain("");
    batch.parts = parts;
    const after = harness.unnamed("select 3");

    harness.connection.batch(batch, parts);
    harness.connection.send(after);
    harness.written();
    const rejected = Assert.throwsAsync(async () => {
      await batch;
    }, BatchException);
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.error("22012", "division by zero"));
    const synced = harness.written();
    harness.receive(M.readyForQuery());
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery());

    await rejected;
    await after;
    Assert.areEqual("", synced);

    const blocked = new ConnectionHarness();
    const blockedParts = [blocked.unnamed("select 1 / 0"), blocked.unnamed("select 2")];
    const second = blockedParts[1];
    if (Object.isUndefined(second))
      throw new TypeError("No part.");
    second.alone = true;
    const blockedBatch = blocked.plain("");
    blockedBatch.parts = blockedParts;
    const waiting = blocked.unnamed("select 3");
    blocked.connection.batch(blockedBatch, blockedParts);
    blocked.connection.send(waiting);
    const written = blocked.written();
    const blockedRejected = Assert.throwsAsync(async () => {
      await blockedBatch;
    }, BatchException);
    blocked.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.error("22012", "division by zero"));
    const resumed = blocked.written();
    blocked.receive(M.readyForQuery());
    const released = blocked.written();
    blocked.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery());

    await blockedRejected;
    await waiting;
    Assert.areEqual("P,D,B,E,P,D,B,E,S", written);
    Assert.areEqual("", resumed);
    Assert.areEqual("P,D,B,E,S", released);
  }

  @TestMethod
  public async sendsLooseValuesThatHaveNoTypeAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.unnamed("select $1 as a, $2 as b", [1, 2], [0]);

    harness.connection.send(query);
    const written = harness.written();
    harness.receive(M.parseComplete(), M.parameterDescription([23, 23]), M.rowDescription([["a", 23], ["b", 23]]), M.bindComplete(), M.dataRow(["1", "2"]), M.commandComplete("SELECT 1"), M.readyForQuery());

    Assert.areEqual("[{\"a\":1,\"b\":2}]", JSON.stringify(await query));
    Assert.areEqual("P,D,B,E,S", written);
  }

  @TestMethod
  public async refusesMoreValuesThanTheProtocolCarriesAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.unnamed("select $1", Array.from({ length: 70000 }, () => 1), [0]);
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, RangeError);

    harness.connection.send(query);

    await rejected;
    Assert.areEqual("", harness.written());
  }

  @TestMethod
  public async destroysTheConnectionWhenAQueuedDescribeStaysSilentAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const head = harness.unnamed("select pg_sleep(10)");
    const describing = harness.unnamed("select $1");
    harness.connection.send(head);
    const described = harness.connection.describeAsync("select $1", [], describing);
    harness.written();
    const rejected = Assert.throwsAsync(() => described, ConnectionClosedException);
    const headRejected = Assert.throwsAsync(async () => {
      await head;
    }, ConnectionClosedException);

    const cancelled = harness.connection.cancelAsync(describing);
    harness.timers.advance(5000);
    await cancelled;

    Assert.isInstanceOf((await rejected).cause, CancelUnansweredException);
    await headRejected;
  }

  @TestMethod
  public async staysQuietAboutACancelledQuerySettledElsewhereAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const head = harness.unnamed("select pg_sleep(10)");
    const queued = harness.unnamed("select 2");
    harness.connection.send(head);
    harness.connection.send(queued);
    harness.written();
    const rejected = Assert.throwsAsync(async () => {
      await queued;
    }, RangeError);

    const cancelled = harness.connection.cancelAsync(queued);
    queued.fail(new RangeError("timed out elsewhere"));
    await rejected;
    harness.timers.advance(5000);

    Assert.isFalse(harness.socket.destroyed);
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery());
    harness.timers.tick();
    await cancelled;
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery());
    await head;
  }

  @TestMethod
  public async settlesAnUnwrittenQueryItHeldWhenItClosesAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const head = harness.unnamed("select 1");
    const broken = harness.unnamed("select $1::int4", [1, 2], [23]);
    harness.connection.send(head);
    harness.connection.send(broken);
    const failures = Promise.all([
      Assert.throwsAsync(async () => {
        await head;
      }, ConnectionClosedException),
      Assert.throwsAsync(async () => {
        await broken;
      }, DataException)
    ]);

    harness.socket.close(null);

    await failures;
  }

  @TestMethod
  public async keepsTheFenceWhileAnotherCursorIsOpenAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    harness.connection.lease = new FakeLease(LeaseKind.Transaction);
    const releases: ((value: unknown) => void)[] = [];
    const first = harness.unnamed("select x from t").useCursor(1, () => new Promise<unknown>(resolve => {
      releases.push(resolve);
    }));
    const second = harness.unnamed("select y from t").useCursor(1, () => new Promise<unknown>(resolve => {
      releases.push(resolve);
    }));
    harness.connection.send(first);
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]), M.portalSuspended(), M.readyForQuery("T"));
    harness.connection.send(second);
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.rowDescription([["y", 23]]), M.bindComplete(), M.dataRow(["1"]), M.portalSuspended(), M.readyForQuery("T"));
    const commit = harness.plain("commit");
    harness.connection.sendSimple(commit, "commit");
    harness.written();

    releases[0]?.(CursorAction.Close);
    const closedFirst = await harness.writtenAsync();
    harness.receive(M.message("3"), M.readyForQuery("T"));
    await first;
    const held = harness.written();
    releases[1]?.(CursorAction.Close);
    const closedSecond = await harness.writtenAsync();
    harness.receive(M.message("3"), M.readyForQuery("T"));
    await second;
    const committed = harness.written();
    harness.receive(M.commandComplete("COMMIT"), M.readyForQuery());
    await commit;

    Assert.areEqual("C,S", closedFirst);
    Assert.areEqual("", held);
    Assert.areEqual("C,S", closedSecond);
    Assert.areEqual("Q", committed);
  }

  @TestMethod
  public async skipsTheRestOfABatchWhoseDescribedValueCannotBeSentAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const circular = { self: {} };
    circular.self = circular;
    const parts = [harness.unnamed("select $1::jsonb as doc", [circular], [0]), harness.unnamed("select 2")];
    const batch = harness.plain("");
    batch.parts = parts;

    harness.connection.batch(batch, parts);
    const described = harness.written();
    const rejected = Assert.throwsAsync(async () => {
      await batch;
    }, BatchException);
    harness.receive(M.parseComplete(), M.parameterDescription([3802]), M.rowDescription([["doc", 3802]]));
    const refused = harness.written();
    harness.receive(M.error("42601", "syntax error"), M.readyForQuery());

    Assert.isInstanceOf((await rejected).cause, TypeError);
    Assert.areEqual("P,D,H", described);
    Assert.areEqual("P,S", refused);
  }

  private static async statusAsync(harness: ConnectionHarness, text: string, status: string): Promise<void> {
    const query = harness.plain(text);
    harness.connection.sendSimple(query, text);
    harness.written();
    harness.receive(M.commandComplete(text.toUpperCase()), M.readyForQuery(status));
    await query;
  }

  @TestMethod
  public async answersABatchOnceForAPartRejectedByItsCloseAndItsCursorAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    harness.connection.lease = new FakeLease(LeaseKind.Transaction);
    let releaseFirst = (): void => undefined;
    let releaseSecond = (): void => undefined;
    const first = harness.unnamed("select x from t").useCursor(1, () => new Promise<void>(resolve => {
      releaseFirst = resolve;
    }));
    const second = harness.unnamed("select y from t").useCursor(1, () => new Promise<void>(resolve => {
      releaseSecond = resolve;
    }));
    const parts = [first, second];
    const batch = harness.plain("");
    batch.parts = parts;
    let settled = false;
    batch.promise.then(() => {
      settled = true;
    }, () => {
      settled = true;
    });
    const rejected = Assert.throwsAsync(async () => {
      await batch;
    }, BatchException);

    harness.connection.batch(batch, parts);
    harness.written();
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]), M.commandComplete("SELECT 1"),
      M.parseComplete(), M.parameterDescription([]), M.rowDescription([["y", 23]]), M.bindComplete(), M.dataRow(["2"]), M.portalSuspended(), M.readyForQuery("T"));
    harness.socket.close(null);
    releaseSecond();
    await new Promise<void>(resolve => setImmediate(resolve));
    const early = settled;
    releaseFirst();

    const error = await rejected;
    Assert.isFalse(early);
    Assert.areEqual(1, error.index);
    Assert.isInstanceOf(error.cause, ConnectionClosedException);
  }

  @TestMethod
  public async retriesAStatementWhoseParametersTheServerNeverDescribedAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.query(new QueryStatement("s1", "select $1 as x"), [1], [0]);
    harness.connection.send(query);
    const first = harness.written();
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, PostgreSQLException);

    harness.receive(M.parseComplete(), M.rowDescription([["x", 23]]), M.error("XX000", "lost"), M.readyForQuery());
    const retried = harness.written();
    harness.receive(M.parseComplete(), M.rowDescription([["x", 23]]));
    const synced = harness.written();
    harness.receive(M.readyForQuery());

    Assert.areEqual("XX000", (await rejected).sqlState);
    Assert.areEqual("P,D,B,E,S", first);
    Assert.areEqual("P,D,H", retried);
    Assert.areEqual("S", synced);
  }

  @TestMethod
  public async resolvesASimpleQueryTheServerAnsweredWithNoResultAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.plain("select 1");
    harness.connection.sendSimple(query, "select 1");
    Assert.areEqual("Q", harness.written());

    harness.receive(M.readyForQuery());

    const result = await query;
    Assert.isInstanceOf(result, Result);
    Assert.areEqual(0, result.length);
    Assert.isNull(result.command);
  }

  @TestMethod
  public async waitsOutTheQueryTimeoutBeforeCancellingATimedOutQueryThatReachesTheHeadAsync(): Promise<void> {
    const harness = new ConnectionHarness({ queryTimeout: 1 });
    const first = harness.unnamed("select 1");
    const second = harness.unnamed("select 2");
    harness.connection.send(first);
    harness.connection.send(second);
    harness.written();
    const rejected = Assert.throwsAsync(async () => {
      await second;
    }, Error);

    second.timedOut = true;
    const cancelled = harness.connection.cancelAsync(second);
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery());
    await first;
    harness.timers.tick();
    const early = harness.starter.cancelled.length;
    harness.timers.advance(1000);
    await cancelled;
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.error("57014", "canceling statement due to user request"), M.readyForQuery());

    await rejected;
    Assert.areEqual(0, early);
    Assert.areEqual(1, harness.starter.cancelled.length);
  }

  private static count(outcome: unknown): number {
    return Array.isArray(outcome) ? outcome.length : -1;
  }
}
