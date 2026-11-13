/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Readable, Writable } from "node:stream";

import { DataException } from "@noldova/context.data";
import { LeaseKind } from "@noldova/context.data.sql.postgresql/enums/lease-kind.js";
import { BatchException } from "@noldova/context.data.sql.postgresql/exceptions/batch.exception.js";
import { BatchSkippedException } from "@noldova/context.data.sql.postgresql/exceptions/batch-skipped.exception.js";
import { CancelUnansweredException } from "@noldova/context.data.sql.postgresql/exceptions/cancel-unanswered.exception.js";
import { ConnectionClosedException } from "@noldova/context.data.sql.postgresql/exceptions/connection-closed.exception.js";
import { PostgreSQLException } from "@noldova/context.data.sql.postgresql/exceptions/postgresql.exception.js";
import { QueryCanceledException } from "@noldova/context.data.sql.postgresql/exceptions/query-canceled.exception.js";
import { UnsafeTransactionException } from "@noldova/context.data.sql.postgresql/exceptions/unsafe-transaction.exception.js";
import { QueryCost } from "@noldova/context.data.sql.postgresql/models/query-cost.js";
import { QueryStatement } from "@noldova/context.data.sql.postgresql/models/query-statement.js";
import { Result } from "@noldova/context.data.sql.postgresql/models/result.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { BackendMessages as M } from "../../fixtures/backend-messages.fixture.js";
import { ConnectionHarness } from "../../fixtures/connection-harness.fixture.js";
import { FakeLease } from "../../fixtures/fake-lease.fixture.js";

@TestClass
export class PostgreSQLConnectionTests {
  @TestMethod
  public async runsAnUnnamedQueryAndParsesItsRowsAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.unnamed("select $1::int as x", [1], [0]);

    harness.connection.send(query);
    Assert.areEqual("P,D,B,E,S", harness.written());
    Assert.isTrue(query.active);
    Assert.areEqual(1, harness.connection.inflight);
    harness.receive(
      M.parseComplete(), M.parameterDescription([23]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]),
      M.commandComplete("SELECT 1"), M.readyForQuery());

    const result = await query;
    Assert.isInstanceOf(result, Result);
    Assert.areEqual("[{\"x\":1}]", JSON.stringify(result));
    Assert.areEqual("SELECT", result.command);
    Assert.areEqual(1, result.count);
    Assert.areEqual("x", result.columns?.[0]?.name);
    Assert.areEqual(1, harness.events.ready);
    Assert.areEqual(0, harness.connection.inflight);
    Assert.areEqual("I", harness.connection.status);
  }

  @TestMethod
  public async reusesAPreparedStatementAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const statement = new QueryStatement("s1", "select $1::int as x");
    const first = harness.query(statement, [1], [23]);

    harness.connection.send(first);
    Assert.areEqual("P,D,B,E,S", harness.written());
    harness.receive(
      M.parseComplete(), M.parameterDescription([23]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]),
      M.commandComplete("SELECT 1"), M.readyForQuery());
    await first;
    Assert.areEqual("23:23", statement.shape);

    const second = harness.query(statement, [2], [23]);
    harness.connection.send(second);
    Assert.areEqual("B,E,S", harness.written());
    harness.receive(M.bindComplete(), M.dataRow(["2"]), M.commandComplete("SELECT 1"), M.readyForQuery());

    Assert.areEqual("[{\"x\":2}]", JSON.stringify(await second));
    Assert.areEqual(1, harness.connection.prepared.size);
  }

  @TestMethod
  public evictsAReadyStatementPastTheLimit(): void {
    const harness = new ConnectionHarness();
    for (let index = 0; index < 1000; index += 1)
      harness.connection.send(harness.query(new QueryStatement("s" + index, "select " + index), [], []));
    harness.written();
    harness.receive(M.parseComplete());

    harness.connection.send(harness.query(new QueryStatement("s1000", "select 1000"), [], []));

    Assert.areEqual("P,D,B,E,S,C", harness.written());
    Assert.areEqual(1000, harness.connection.prepared.size);
    Assert.isFalse(harness.connection.prepared.has("s0"));
    Assert.isTrue(harness.connection.prepared.has("s1000"));
  }

  @TestMethod
  public async retriesWhenThePreparedStatementIsGoneAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const statement = new QueryStatement("s1", "select $1::int as x");
    const first = harness.query(statement, [1], [23]);
    harness.connection.send(first);
    harness.receive(
      M.parseComplete(), M.parameterDescription([23]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]),
      M.commandComplete("SELECT 1"), M.readyForQuery());
    await first;
    harness.written();

    const second = harness.query(statement, [5], [23]);
    harness.connection.send(second);
    Assert.areEqual("B,E,S", harness.written());
    harness.receive(M.error("26000", "prepared statement \"s1\" does not exist"), M.readyForQuery());
    Assert.areEqual("P,D,H", harness.written());
    harness.receive(M.parseComplete(), M.parameterDescription([23]), M.rowDescription([["x", 23]]));
    Assert.areEqual("B,E,S", harness.written());
    harness.receive(M.bindComplete(), M.dataRow(["5"]), M.commandComplete("SELECT 1"), M.readyForQuery());

    Assert.areEqual("[{\"x\":5}]", JSON.stringify(await second));
    Assert.isFalse(harness.connection.prepared.has("s1"));
  }

  @TestMethod
  public async renamesAStatementThatAlreadyExistsAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const statement = new QueryStatement("s1", "select $1::int as x");
    const query = harness.query(statement, [1], [23]);

    harness.connection.send(query);
    harness.written();
    harness.receive(M.error("42P05", "prepared statement \"s1\" already exists"), M.readyForQuery());
    Assert.areEqual("s1_", statement.name);
    Assert.areEqual("P,D,H", harness.written());
    harness.receive(M.parseComplete(), M.parameterDescription([23]), M.rowDescription([["x", 23]]));
    Assert.areEqual("B,E,S", harness.written());
    harness.receive(M.bindComplete(), M.dataRow(["1"]), M.commandComplete("SELECT 1"), M.readyForQuery());

    Assert.areEqual("[{\"x\":1}]", JSON.stringify(await query));
    Assert.areEqual(1, statement.version);
  }

  @TestMethod
  public async rejectsAServerErrorAndStaysUsableAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const failing = harness.unnamed("select 1 / $1", [0], [23]);
    harness.connection.send(failing);
    const rejected = Assert.throwsAsync(async () => {
      await failing;
    }, PostgreSQLException);
    harness.receive(M.parseComplete(), M.parameterDescription([23]), M.rowDescription([["x", 23]]), M.bindComplete(), M.error("22012", "division by zero"),
      M.readyForQuery());

    Assert.areEqual("22012", (await rejected).sqlState);
    const next = harness.unnamed("select 1 as x");
    harness.connection.send(next);
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]),
      M.commandComplete("SELECT 1"), M.readyForQuery());
    Assert.areEqual("[{\"x\":1}]", JSON.stringify(await next));
  }

  @TestMethod
  public async runsASimpleQueryWithSeveralResultsAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.plain("select 1 as a; select 2 as b");

    harness.connection.sendSimple(query, "select 1 as a; select 2 as b");
    Assert.areEqual("Q", harness.written());
    harness.receive(
      M.rowDescription([["a", 23]]), M.dataRow(["1"]), M.commandComplete("SELECT 1"),
      M.rowDescription([["b", 23]]), M.dataRow(["2"]), M.commandComplete("SELECT 1"), M.readyForQuery());

    Assert.areEqual("[[{\"a\":1}],[{\"b\":2}]]", JSON.stringify(await query));
  }

  @TestMethod
  public async resolvesAnEmptySimpleQueryAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.plain("");

    harness.connection.sendSimple(query, "");
    harness.receive(M.emptyQuery(), M.readyForQuery());

    const result = await query;
    Assert.isInstanceOf(result, Result);
    Assert.areEqual(0, result.length);
  }

  @TestMethod
  public async settlesABatchWithTheFailingIndexAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const parts = [harness.unnamed("select 1 as x"), harness.unnamed("select 1 / 0 as y")];
    const batch = harness.plain("");
    batch.parts = parts;

    harness.connection.batch(batch, parts);
    Assert.areEqual("P,D,B,E,P,D,B,E,S", harness.written());
    const rejected = Assert.throwsAsync(async () => {
      await batch;
    }, BatchException);
    harness.receive(
      M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]), M.commandComplete("SELECT 1"),
      M.parseComplete(), M.parameterDescription([]), M.rowDescription([["y", 23]]), M.bindComplete(), M.error("22012", "division by zero"),
      M.readyForQuery());

    const error = await rejected;
    Assert.areEqual(1, error.index);
    Assert.isInstanceOf(error.cause, PostgreSQLException);
    const skipped = await Assert.throwsAsync(() => parts[0]?.promise ?? Promise.resolve(), BatchSkippedException);
    Assert.areEqual(1, skipped.index);
    Assert.areEqual("BatchSkippedException", skipped.name);
    await Assert.throwsAsync(() => parts[1]?.promise ?? Promise.resolve(), PostgreSQLException);
  }

  @TestMethod
  public async resolvesABatchInOrderAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const parts = [harness.unnamed("select 1 as x"), harness.unnamed("select 2 as x")];
    const batch = harness.plain("");
    batch.parts = parts;

    harness.connection.batch(batch, parts);
    harness.receive(
      M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]), M.commandComplete("SELECT 1"),
      M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["2"]), M.commandComplete("SELECT 1"),
      M.readyForQuery());

    Assert.areEqual("[[{\"x\":1}],[{\"x\":2}]]", JSON.stringify(await batch));
    Assert.areEqual("[{\"x\":2}]", JSON.stringify(await (parts[1]?.promise ?? Promise.resolve())));
  }

  @TestMethod
  public async cancelsAPendingQueryBeforeItIsSentAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const describing = harness.unnamed("select $1", ["a"], [0]);
    const waiting = harness.unnamed("select 2");

    harness.connection.send(describing);
    harness.connection.send(waiting);
    Assert.areEqual("P,D,H", harness.written());
    Assert.areEqual(2, harness.connection.inflight);
    const rejected = Assert.throwsAsync(async () => {
      await waiting;
    }, QueryCanceledException);
    await harness.connection.cancelAsync(waiting);

    await rejected;
    Assert.areEqual(1, harness.connection.inflight);
    Assert.areEqual("", harness.written());
  }

  @TestMethod
  public async destroysTheConnectionWhenACancelIsUnansweredAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.unnamed("select pg_sleep(10)");
    harness.connection.send(query);
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, ConnectionClosedException);

    await harness.connection.cancelAsync(query);
    Assert.areEqual(7, harness.starter.cancelled[0]?.pid);
    harness.timers.advance(5000);

    const error = await rejected;
    Assert.isTrue(error.destroyed);
    Assert.isInstanceOf(error.cause, CancelUnansweredException);
    Assert.isTrue(harness.socket.destroyed);
    Assert.areEqual(1, harness.events.closes.length);
  }

  @TestMethod
  public async rejectsEveryQueryWhenTheSocketClosesAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const first = harness.unnamed("select 1");
    harness.connection.send(first);
    const rejected = Assert.throwsAsync(async () => {
      await first;
    }, ConnectionClosedException);

    harness.socket.close(null);

    Assert.isFalse((await rejected).destroyed);
    Assert.isNotNull(harness.connection.closed);
    const late = harness.unnamed("select 2");
    const refused = Assert.throwsAsync(async () => {
      await late;
    }, ConnectionClosedException);
    harness.connection.send(late);
    await refused;
  }

  @TestMethod
  public async keepsTheServersFatalErrorAsTheCauseAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    harness.receive(M.error("57P01", "terminating connection due to administrator command", "FATAL"));

    harness.socket.close(null);

    Assert.isInstanceOf(harness.events.closes[0]?.cause, PostgreSQLException);
    await Promise.resolve();
  }

  @TestMethod
  public async rollsBackAnUnsafeTransactionAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.plain("begin");
    harness.connection.sendSimple(query, "begin");
    harness.written();
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, UnsafeTransactionException);

    harness.receive(M.commandComplete("BEGIN"), M.readyForQuery("T"));
    await rejected;
    Assert.areEqual("Q", harness.written());
    harness.receive(M.commandComplete("ROLLBACK"), M.readyForQuery("I"));

    Assert.areEqual("I", harness.connection.status);
    Assert.areEqual(0, harness.connection.inflight);
  }

  @TestMethod
  public deliversNoticesNotificationsAndParameters(): void {
    const notices: string[] = [];
    const harness = new ConnectionHarness({ onnotice: notice => notices.push(notice.get("message") ?? "") });

    harness.receive(M.notice("hello"), M.notification(5, "jobs", "go"), M.parameterStatus("TimeZone", "UTC"));

    Assert.areEqual("hello", notices.join(","));
    Assert.areEqual("jobs:go:5", harness.events.notifications.join(","));
    Assert.areEqual("UTC", harness.connection.parameters.get("TimeZone"));
    Assert.areEqual("TimeZone=UTC", harness.events.parameters.join(","));
  }

  @TestMethod
  public ignoresAFailingNoticeHandler(): void {
    const harness = new ConnectionHarness({
      onnotice: () => {
        throw new DataException("notice");
      }
    });

    harness.receive(M.notice("hello"), M.parameterStatus("a", "b"));

    Assert.areEqual("b", harness.connection.parameters.get("a"));
  }

  @TestMethod
  public async streamsCopyOutDataAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.plain("copy t to stdout");
    query.streaming = true;

    harness.connection.sendSimple(query, "copy t to stdout");
    Assert.isTrue(harness.connection.copying);
    harness.receive(M.copyOut(), M.copyData("a\n"), M.copyData("b\n"), M.copyDone(), M.commandComplete("COPY 2"), M.readyForQuery());

    const stream = await query;
    Assert.isInstanceOf(stream, Readable);
    const chunks: string[] = [];
    await new Promise<void>(resolve => {
      stream.on("data", (chunk: unknown) => chunks.push(String(chunk)));
      stream.once("end", () => resolve());
    });
    Assert.areEqual("a\nb\n", chunks.join(""));
    Assert.isFalse(harness.connection.copying);
  }

  @TestMethod
  public async writesCopyInDataAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.plain("copy t from stdin");
    query.streaming = true;
    harness.connection.sendSimple(query, "copy t from stdin");
    harness.written();
    harness.receive(M.copyIn());

    const stream = await query;
    Assert.isInstanceOf(stream, Writable);
    const finished = new Promise<void>(resolve => stream.once("finish", () => resolve()));
    stream.write("1\n");
    stream.end();
    await harness.socket.waitForAsync(() => harness.socket.peek().endsWith("c"));
    Assert.areEqual("d,c", harness.socket.take());
    harness.receive(M.commandComplete("COPY 1"), M.readyForQuery());

    await finished;
    Assert.areEqual(0, harness.connection.inflight);
  }

  @TestMethod
  public async refusesAQueryDuringCopyAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const copy = harness.plain("copy t from stdin");
    copy.streaming = true;
    harness.connection.sendSimple(copy, "copy t from stdin");
    harness.receive(M.copyIn());
    await copy;
    const other = harness.unnamed("select 1");
    const rejected = Assert.throwsAsync(async () => {
      await other;
    }, DataException);

    harness.connection.send(other);

    await rejected;
  }

  @TestMethod
  public async waitsForUnknownTypesBeforeReadingAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    harness.events.isTyped = false;
    harness.events.unknownTypes = true;
    const query = harness.unnamed("select $1::int as x", [1], [23]);
    harness.connection.send(query);

    harness.receive(
      M.parseComplete(), M.parameterDescription([23]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]),
      M.commandComplete("SELECT 1"), M.readyForQuery());
    Assert.areEqual(1, harness.events.needed.length);
    Assert.isFalse(query.settled);
    harness.events.unknownTypes = false;
    harness.connection.go();

    Assert.areEqual("[{\"x\":1}]", JSON.stringify(await query));
  }

  @TestMethod
  public async measuresTheCostOfAQueryAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.unnamed("select 1 as x");
    query.cost = new QueryCost(200);

    harness.connection.send(query);
    Assert.isTrue(harness.connection.notable);
    Assert.isTrue(harness.connection.isHeavy());
    Assert.areEqual(200, harness.connection.computeBacklog(0));
    harness.timers.advance(50);
    Assert.areEqual(150, harness.connection.computeBacklog(50));
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery());
    await query;

    Assert.areEqual(185, query.cost.estimate);
    Assert.areEqual("50", harness.events.timed.join(","));
    Assert.isFalse(harness.connection.notable);
    Assert.isFalse(harness.connection.isHeavy());
  }

  @TestMethod
  public async runsAFlushingCursorInBatchesAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const batches: number[] = [];
    const query = harness.unnamed("select x from t").useCursor(1, rows => {
      batches.push(rows.length);
    });

    harness.connection.send(query);
    Assert.areEqual("P,D,B,E,H", harness.written());
    Assert.isTrue(harness.connection.exclusive);
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]), M.portalSuspended());
    Assert.areEqual("E,H", await harness.writtenAsync());
    harness.receive(M.dataRow(["2"]), M.commandComplete("SELECT 1"));
    Assert.areEqual("S", harness.written());
    harness.receive(M.readyForQuery());

    await query;
    Assert.areEqual("1,1", batches.join(","));
  }

  @TestMethod
  public async stepsACursorInsideATransactionAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    harness.connection.lease = new FakeLease(LeaseKind.Transaction);
    const batches: number[] = [];
    const query = harness.unnamed("select x from t").useCursor(1, rows => {
      batches.push(rows.length);
    });

    harness.connection.send(query);
    Assert.areEqual("P,D,B,E,S", harness.written());
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]), M.portalSuspended(),
      M.readyForQuery("T"));
    Assert.areEqual("E,S", await harness.writtenAsync());
    harness.receive(M.dataRow(["2"]), M.commandComplete("SELECT 1"), M.readyForQuery("T"));

    await query;
    Assert.areEqual("1,1", batches.join(","));
  }

  @TestMethod
  public async describesAStatementAsync(): Promise<void> {
    const harness = new ConnectionHarness();

    const described = harness.connection.describeAsync("select $1 as x", [0], null);
    Assert.areEqual("P,D,S", harness.written());
    harness.receive(M.parseComplete(), M.parameterDescription([23]), M.rowDescription([["x", 25]]), M.readyForQuery());

    const shape = await described;
    Assert.areEqual("23", shape.params.join(","));
    Assert.areEqual("x", shape.columns?.[0]?.name);
  }

  @TestMethod
  public async rejectsADescribeThatFailsAsync(): Promise<void> {
    const harness = new ConnectionHarness();

    const described = harness.connection.describeAsync("select nope", [], null);
    harness.receive(M.error("42703", "column \"nope\" does not exist"), M.readyForQuery());

    await Assert.throwsAsync(() => described, PostgreSQLException);
  }

  @TestMethod
  public refusesAQueryWithoutAStatement(): void {
    const harness = new ConnectionHarness();

    Assert.throws(() => harness.connection.send(harness.plain("select 1")), DataException);
  }

  @TestMethod
  public async closesAfterTheLastQueryAsync(): Promise<void> {
    const harness = new ConnectionHarness();

    const closing = harness.connection.closeAsync();
    Assert.areEqual(closing, harness.connection.closeAsync());
    await closing;

    Assert.areEqual("5800000004", harness.socket.ended?.toString("hex"));
    Assert.isTrue(harness.events.closes[0]?.destroyed === true);
    Assert.isTrue(harness.connection.closing);
  }

  @TestMethod
  public async failsTheHeadOnAnUnsupportedMessageAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.unnamed("select 1");
    harness.connection.send(query);
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, DataException);

    harness.receive(M.message("V"), M.readyForQuery());

    Assert.isTrue((await rejected).message.includes("FunctionCallResponse"));
  }

  @TestMethod
  public destroysTheConnectionOnAMessageNoQueryAwaits(): void {
    const harness = new ConnectionHarness();

    harness.receive(M.commandComplete("SELECT 1"));

    Assert.isTrue(harness.socket.destroyed);
    Assert.isInstanceOf(harness.events.closes[0]?.cause, DataException);
  }

  @TestMethod
  public async settlesALocalFailureWithoutTheServerAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const query = harness.unnamed("select 1");
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, DataException);

    harness.connection.failLocally(query, new DataException("not built"));

    Assert.areEqual("not built", (await rejected).message);
    Assert.areEqual("", harness.written());
  }

  @TestMethod
  public readsFramesLeftOverFromTheStartup(): void {
    const harness = new ConnectionHarness({}, M.parameterStatus("application_name", "app"));

    Assert.areEqual("app", harness.connection.parameters.get("application_name"));
    Assert.isFalse(harness.socket.paused);
  }
}
