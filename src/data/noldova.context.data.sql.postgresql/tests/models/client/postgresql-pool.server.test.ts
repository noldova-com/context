/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";
import { Readable, Writable } from "node:stream";

import "@noldova/context.core";
import { DataException } from "@noldova/context.data";
import { ChannelBinding } from "@noldova/context.data.sql.postgresql/enums/channel-binding.js";
import { CursorAction } from "@noldova/context.data.sql.postgresql/enums/cursor-action.js";
import { LeaseKind } from "@noldova/context.data.sql.postgresql/enums/lease-kind.js";
import { SslMode } from "@noldova/context.data.sql.postgresql/enums/ssl-mode.js";
import { BatchException } from "@noldova/context.data.sql.postgresql/exceptions/batch.exception.js";
import { ConnectionClosedException } from "@noldova/context.data.sql.postgresql/exceptions/connection-closed.exception.js";
import { PostgreSQLException } from "@noldova/context.data.sql.postgresql/exceptions/postgresql.exception.js";
import { QueryTimeoutException } from "@noldova/context.data.sql.postgresql/exceptions/query-timeout.exception.js";
import { UnsafeTransactionException } from "@noldova/context.data.sql.postgresql/exceptions/unsafe-transaction.exception.js";
import { BuiltQuery } from "@noldova/context.data.sql.postgresql/models/built-query.js";
import { ClientOptions } from "@noldova/context.data.sql.postgresql/models/client-options.js";
import { ConnectionOptions } from "@noldova/context.data.sql.postgresql/models/connection-options.js";
import { SystemCertificates } from "@noldova/context.data.sql.postgresql/models/system-certificates.js";
import { Result } from "@noldova/context.data.sql.postgresql/models/result.js";
import { StatementDescription } from "@noldova/context.data.sql.postgresql/models/statement-description.js";
import { TransformOptions } from "@noldova/context.data.sql.postgresql/models/transform-options.js";
import { PostgreSQLPool } from "@noldova/context.data.sql.postgresql/models/client/postgresql-pool.js";
import { Query } from "@noldova/context.data.sql.postgresql/models/client/query.js";
import { SessionStarter } from "@noldova/context.data.sql.postgresql/services/session-starter.js";
import { TypeRegistry } from "@noldova/context.data.sql.postgresql/models/type-registry.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { FakeServer } from "../../fixtures/fake-server.fixture.js";
import { RealPool } from "../../fixtures/real-pool.fixture.js";
import { Released } from "../../fixtures/released.fixture.js";

@TestClass
export class PostgreSQLPoolServerTests {
  private static readonly QUERY_TIMEOUT_SECONDS: number = 0.5;

  @TestMethod
  public async runsQueriesWithParametersAndParsesTheirTypesAsync(): Promise<void> {
    await using real = new RealPool();

    const rows = await real.rowsAsync(
      "select $1::int4 as i, $2::text as t, $3::bool as b, $4::int8 as big, $5::float8 as f, $6::bytea as bytes, $7::int4[] as ints, "
      + "$8::text[] as texts, $9::jsonb as doc, $10::timestamptz as at, null::int4 as missing",
      [7, "seven", true, 9007199254740993n, 1.5, Buffer.from([1, 2, 255]), [1, 2, null], ["a", "b,c", null], { a: [1] }, new Date(Date.UTC(2026, 0, 2))]);
    const again = await real.rowsAsync("select $1::int4 + 1 as n", [41]);
    const ended = await real.endAsync();

    const row = rows[0];
    Assert.isTrue(row instanceof Object);
    Assert.areEqual(1, rows.length);
    Assert.areEqual("SELECT", rows.command);
    Assert.areEqual(1, rows.count);
    Assert.areEqual(JSON.stringify({
      i: 7, t: "seven", b: true, big: "9007199254740993", f: 1.5, bytes: { type: "Buffer", data: [1, 2, 255] }, ints: [1, 2, null], texts: ["a", "b,c", null],
      doc: { a: [1] }, at: "2026-01-02T00:00:00.000Z", missing: null
    }), JSON.stringify(row));
    Assert.areEqual(JSON.stringify([{ n: 42 }]), JSON.stringify(again));
    Assert.isTrue(ended);
  }

  @TestMethod
  public async pipelinesQueriesOnOneConnectionAsync(): Promise<void> {
    await using real = new RealPool({ max: 1 });

    const outcomes = await Promise.all(Array.from({ length: 20 }, (_, index) => real.rowsAsync("select $1::int4 as n", [index])));
    const pids = await Promise.all([real.rowsAsync("select pg_backend_pid() as pid"), real.rowsAsync("select pg_backend_pid() as pid")]);
    const ended = await real.endAsync();

    Assert.areEqual(Array.from({ length: 20 }, (_, index) => index).join(), outcomes.map(rows => JSON.stringify(rows[0])).map(text => JSON.parse(text).n).join());
    Assert.areEqual(JSON.stringify(pids[0]), JSON.stringify(pids[1]));
    Assert.isTrue(ended);
  }

  @TestMethod
  public async reprepresAStatementTheServerForgotAsync(): Promise<void> {
    await using real = new RealPool({ max: 1 });

    const first = await real.rowsAsync("select $1::int4 * 2 as n", [2]);
    await real.query("deallocate all").useSimpleProtocol();
    const second = await real.rowsAsync("select $1::int4 * 2 as n", [3]);
    const ended = await real.endAsync();

    Assert.areEqual(JSON.stringify([{ n: 4 }]), JSON.stringify(first));
    Assert.areEqual(JSON.stringify([{ n: 6 }]), JSON.stringify(second));
    Assert.isTrue(ended);
  }

  @TestMethod
  public async retriesAStatementWhoseResultChangedShapeAsync(): Promise<void> {
    await using real = new RealPool({ max: 1 });
    const lease = await real.pool.acquireLeaseAsync(LeaseKind.Reserve);

    await real.leased(lease, "create temporary table shapes (a int4)").useSimpleProtocol();
    await real.leased(lease, "insert into shapes values (1)").useSimpleProtocol();
    lease.release();
    const before = await real.rowsAsync("select * from shapes");
    await real.query("alter table shapes add column b text default 'x'").useSimpleProtocol();
    const after = await real.rowsAsync("select * from shapes");
    const ended = await real.endAsync();

    Assert.areEqual(JSON.stringify([{ a: 1 }]), JSON.stringify(before));
    Assert.areEqual(JSON.stringify([{ a: 1, b: "x" }]), JSON.stringify(after));
    Assert.isTrue(ended);
  }

  @TestMethod
  public async describesAStatementWithoutRunningItAsync(): Promise<void> {
    await using real = new RealPool();

    const described = await real.query("select $1::int4 as n, $2::text as t", [1, "a"]).describe();
    const failed = await Assert.throwsAsync(async () => {
      await real.query("select from nowhere_at_all").describe();
    }, PostgreSQLException);
    const ended = await real.endAsync();

    Assert.isInstanceOf(described, StatementDescription);
    Assert.areEqual("42P01", failed.sqlState);
    Assert.isTrue(ended);
  }

  @TestMethod
  public async rejectsAnErrorAndStaysUsableAsync(): Promise<void> {
    await using real = new RealPool({ max: 1 });

    const failed = await Assert.throwsAsync(async () => {
      await real.query("select 1 / $1::int4", [0]);
    }, PostgreSQLException);
    const simple = await Assert.throwsAsync(async () => {
      await real.query("select 1 / 0").useSimpleProtocol();
    }, PostgreSQLException);
    const after = await real.rowsAsync("select 1 as n");
    const ended = await real.endAsync();

    Assert.areEqual("22012", failed.sqlState);
    Assert.areEqual("ERROR", failed.severity);
    Assert.areEqual("22012", simple.sqlState);
    Assert.areEqual(JSON.stringify([{ n: 1 }]), JSON.stringify(after));
    Assert.isTrue(ended);
  }

  @TestMethod
  public async closesOnAFatalErrorAndOpensAgainAsync(): Promise<void> {
    const closed: number[] = [];
    await using real = new RealPool({ max: 1, onclose: connection => closed.push(connection) });

    const fatal = await Assert.throwsAsync(async () => {
      await real.query("select pg_terminate_backend(pg_backend_pid())").useSimpleProtocol();
    }, Error);
    const after = await real.rowsAsync("select 1 as n");
    const ended = await real.endAsync();

    Assert.isTrue(fatal instanceof PostgreSQLException || fatal instanceof ConnectionClosedException);
    Assert.areEqual(JSON.stringify([{ n: 1 }]), JSON.stringify(after));
    Assert.isTrue(closed.length >= 1);
    Assert.isTrue(ended);
  }

  @TestMethod
  public async runsSimpleQueriesWithSeveralResultsAsync(): Promise<void> {
    await using real = new RealPool();

    const several = RealPool.results(await real.query("select 1 as a; select 2 as b").useSimpleProtocol());
    const empty = await real.query("").useSimpleProtocol();
    const ended = await real.endAsync();

    Assert.areEqual(JSON.stringify([[{ a: 1 }], [{ b: 2 }]]), JSON.stringify(several));
    Assert.areEqual(JSON.stringify([]), JSON.stringify(empty));
    Assert.isTrue(ended);
  }

  @TestMethod
  public async copiesRowsOutAndInAsync(): Promise<void> {
    await using real = new RealPool({ max: 1 });
    const lease = await real.pool.acquireLeaseAsync(LeaseKind.Reserve);

    await real.leased(lease, "create temporary table copied (n int4, t text)").useSimpleProtocol();
    const writable = await real.leased(lease, "copy copied from stdin").openWritableAsync();
    if (!(writable instanceof Writable))
      throw new TypeError("No writable stream.");
    await new Promise<void>((resolve, reject) => {
      writable.on("error", reject);
      writable.on("finish", () => resolve());
      for (let index = 0; index < 200; index += 1)
        writable.write(`${index.toString()}\trow ${index.toString()}\n`);
      writable.end();
    });
    const counted = await real.leased(lease, "select count(*)::int4 as n from copied");
    const readable = await real.leased(lease, "copy (select n from copied order by n) to stdout").openReadableAsync();
    if (!(readable instanceof Readable))
      throw new TypeError("No readable stream.");
    const chunks: Buffer[] = [];
    for await (const chunk of readable)
      chunks.push(Buffer.from(chunk));
    lease.release();
    const ended = await real.endAsync();

    Assert.areEqual(JSON.stringify([{ n: 200 }]), JSON.stringify(counted));
    Assert.areEqual(Array.from({ length: 200 }, (_, index) => `${index.toString()}\n`).join(""), Buffer.concat(chunks).toString());
    Assert.isTrue(ended);
  }

  @TestMethod
  public async failsACopyInTheClientAbortsAsync(): Promise<void> {
    await using real = new RealPool({ max: 1 });
    const lease = await real.pool.acquireLeaseAsync(LeaseKind.Reserve);

    await real.leased(lease, "create temporary table aborted (n int4)").useSimpleProtocol();
    const writable = await real.leased(lease, "copy aborted from stdin").openWritableAsync();
    if (!(writable instanceof Writable))
      throw new TypeError("No writable stream.");
    const closed = new Promise<unknown>(resolve => {
      writable.on("error", resolve);
      writable.on("close", () => resolve(null));
    });
    writable.write("1\n");
    writable.destroy(new Error("stop"));
    await closed;
    const counted = await real.leased(lease, "select count(*)::int4 as n from aborted");
    lease.release();
    const ended = await real.endAsync();

    Assert.areEqual(JSON.stringify([{ n: 0 }]), JSON.stringify(counted));
    Assert.isTrue(ended);
  }

  @TestMethod
  public async readsACursorInBatchesAsync(): Promise<void> {
    await using real = new RealPool();
    const sizes: number[] = [];
    const closedAt: number[] = [];

    await real.query("select generate_series(1, 25) as n").useCursor(10, rows => {
      sizes.push(rows.length);
    });
    await real.query("select generate_series(1, 25) as n").useCursor(10, rows => {
      closedAt.push(rows.length);
      return CursorAction.Close;
    });
    const iterated: number[] = [];
    for await (const rows of real.query("select generate_series(1, 7) as n").iterateCursor(3))
      iterated.push(rows.length);
    const ended = await real.endAsync();

    Assert.areEqual("10,10,5", sizes.join());
    Assert.areEqual("10", closedAt.join());
    Assert.areEqual("3,3,1", iterated.join());
    Assert.isTrue(ended);
  }

  @TestMethod
  public async stepsACursorInsideATransactionAsync(): Promise<void> {
    await using real = new RealPool();
    const lease = await real.pool.acquireLeaseAsync(LeaseKind.Transaction);
    const sizes: number[] = [];

    await real.leased(lease, "begin").useSimpleProtocol();
    await real.leased(lease, "select generate_series(1, 25) as n").useCursor(10, async rows => {
      sizes.push(rows.length);
      await Promise.resolve();
    });
    const failed = await Assert.throwsAsync(async () => {
      await real.leased(lease, "select generate_series(1, 25) as n").useCursor(10, () => {
        throw new RangeError("enough");
      });
    }, RangeError);
    await real.leased(lease, "rollback").useSimpleProtocol();
    lease.release();
    const ended = await real.endAsync();

    Assert.areEqual("10,10,5", sizes.join());
    Assert.areEqual("enough", failed.message);
    Assert.isTrue(ended);
  }

  @TestMethod
  public async hearsNotificationsNoticesAndParametersAsync(): Promise<void> {
    const heard: string[] = [];
    await using real = new RealPool({
      max: 1,
      onnotify: (channel, payload) => heard.push(`notify:${channel}:${payload}`),
      onnotice: notice => heard.push(`notice:${notice.get("message") ?? ""}`),
      onparameter: (name, value) => heard.push(`parameter:${name}:${value}`)
    });

    await real.query("listen noldova_channel").useSimpleProtocol();
    await real.query("select pg_notify('noldova_channel', 'hello')");
    await real.query("do $$ begin raise notice 'careful'; end $$").useSimpleProtocol();
    await real.query("set application_name = 'noldova-pool'").useSimpleProtocol();
    await real.query("select 1").useSimpleProtocol();
    const ended = await real.endAsync();

    Assert.isTrue(heard.includes("notify:noldova_channel:hello"));
    Assert.isTrue(heard.includes("notice:careful"));
    Assert.isTrue(heard.includes("parameter:application_name:noldova-pool"));
    Assert.isTrue(ended);
  }

  @TestMethod
  public async cancelsARunningQueryAndOneQueuedBehindItAsync(): Promise<void> {
    await using real = new RealPool({ max: 1 });
    await using watcher = new RealPool({ max: 1 });

    const sleeping = real.query("select pg_sleep(30), 'noldova-sleeping' as tag");
    const queued = real.query("select pg_sleep(30), 'noldova-queued' as tag");
    const running = real.query("select 2 as n");
    const failed = Assert.throwsAsync(async () => {
      await sleeping;
    }, Error);
    const late = Assert.throwsAsync(async () => {
      await queued;
    }, Error);
    const after = running.then(rows => rows);
    await PostgreSQLPoolServerTests.untilRunningAsync(watcher, "noldova-sleeping");
    await sleeping.cancelAsync();
    const error = await failed;
    await PostgreSQLPoolServerTests.untilRunningAsync(watcher, "noldova-queued");
    await queued.cancelAsync();
    const lateError = await late;
    const rows = await after;
    await watcher.pool.endAsync();
    const ended = await real.endAsync();

    Assert.areEqual("PostgreSQLException:57014:canceling statement due to user request", PostgreSQLPoolServerTests.describe(error));
    Assert.areEqual("PostgreSQLException:57014:canceling statement due to user request", PostgreSQLPoolServerTests.describe(lateError));
    Assert.areEqual(JSON.stringify([{ n: 2 }]), JSON.stringify(rows));
    Assert.isTrue(ended);
  }

  @TestMethod
  public async closesACancelTheServerNeverAnswersWhenTheEndTimesOutAsync(): Promise<void> {
    const server = await FakeServer.startAsync();
    const cancelReceived = new Promise<void>(resolve => {
      server.onCancel = () => resolve();
    });
    const messageReceived = new Promise<void>(resolve => {
      server.onMessage = () => resolve();
    });
    const options = new ClientOptions({ max: 1, cancelTimeout: 0, fetchTypes: false, maxLifetime: null });
    const connection = new ConnectionOptions("127.0.0.1", server.port, "app", "app", "", SslMode.Disable, ChannelBinding.Prefer, 0, new Map(), new SystemCertificates());
    const pool = new PostgreSQLPool(options, connection, new TypeRegistry(options), values => new SessionStarter(values, options.cancelTimeout));
    try {
      const query = new Query(new BuiltQuery("select pg_sleep(30)", [], []), pool);
      const failed = Assert.throwsAsync(async () => {
        await query;
      }, ConnectionClosedException);
      await messageReceived;

      const cancelled = Assert.throwsAsync(() => query.cancelAsync(), ConnectionClosedException);
      await cancelReceived;
      await pool.endAsync(0.01);
      const cancelError = await cancelled;
      const queryError = await failed;

      Assert.isTrue(cancelError.destroyed);
      Assert.isTrue(queryError.destroyed);
      Assert.areEqual(1, server.cancels.length);
    }
    finally {
      await server.closeAsync();
    }
    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async timesOutASlowQueryAsync(): Promise<void> {
    await using real = new RealPool({ max: 1, queryTimeout: PostgreSQLPoolServerTests.QUERY_TIMEOUT_SECONDS });
    let error: QueryTimeoutException;
    let after: Result;
    let ended = false;
    try {
      await PostgreSQLPoolServerTests.openAsync(real);
      error = await Assert.throwsAsync(async () => {
        await real.query("select pg_sleep(30)");
      }, QueryTimeoutException);
      after = await PostgreSQLPoolServerTests.selectOneOnceFreeAsync(real);
    }
    finally {
      ended = await real.endAsync();
    }

    Assert.isTrue(error.message.length > 0);
    Assert.areEqual("QueryTimeoutException", error.name);
    Assert.areEqual(JSON.stringify([{ n: 1 }]), JSON.stringify(after));
    Assert.isTrue(ended);
  }

  @TestMethod
  public async commitsAndRollsBackInATransactionLeaseAsync(): Promise<void> {
    await using real = new RealPool();
    const setup = await real.pool.acquireLeaseAsync(LeaseKind.Reserve);
    await real.leased(setup, "create temporary table ledger (n int4)").useSimpleProtocol();

    await real.leased(setup, "begin").useSimpleProtocol();
    await real.leased(setup, "insert into ledger values ($1)", [1]);
    await real.leased(setup, "commit").useSimpleProtocol();
    await real.leased(setup, "begin").useSimpleProtocol();
    await real.leased(setup, "insert into ledger values ($1)", [2]);
    await real.leased(setup, "rollback").useSimpleProtocol();
    const rows = await real.leased(setup, "select n from ledger");
    setup.release();
    const after = await Assert.throwsAsync(async () => {
      await real.leased(setup, "select 1");
    }, UnsafeTransactionException);
    const ended = await real.endAsync();

    Assert.areEqual(JSON.stringify([{ n: 1 }]), JSON.stringify(rows));
    Assert.isTrue(after.message.length > 0);
    Assert.isTrue(ended);
  }

  @TestMethod
  public async rollsBackATransactionLeftOpenOutsideALeaseAsync(): Promise<void> {
    await using real = new RealPool({ max: 2 });

    const error = await Assert.throwsAsync(async () => {
      await real.query("begin").useSimpleProtocol();
    }, UnsafeTransactionException);
    const status = await real.rowsAsync("select 1 as n");
    const ended = await real.endAsync();

    Assert.isTrue(error.message.length > 0);
    Assert.areEqual(JSON.stringify([{ n: 1 }]), JSON.stringify(status));
    Assert.isTrue(ended);
  }

  @TestMethod
  public async runsABatchAndReportsItsFailingPartAsync(): Promise<void> {
    await using real = new RealPool();

    const results = RealPool.results(await real.batch(real.query("select $1::int4 as n", [1]), real.query("select $1::text as t", ["b"])));
    const failed = await Assert.throwsAsync(async () => {
      await real.batch(real.query("select 1 as n"), real.query("select 1 / $1::int4", [0]), real.query("select 3 as n"));
    }, BatchException);
    const ended = await real.endAsync();

    Assert.areEqual(JSON.stringify([[{ n: 1 }], [{ t: "b" }]]), JSON.stringify(results));
    Assert.isInstanceOf(failed.cause, PostgreSQLException);
    Assert.isTrue(ended);
  }

  @TestMethod
  public async appliesTransformsRowModesAndDebugAsync(): Promise<void> {
    const debugged: string[] = [];
    await using real = new RealPool({
      transform: new TransformOptions({ columnFrom: name => name.toUpperCase(), rowFrom: row => ({ wrapped: row }) }),
      debug: (_connection, text) => debugged.push(text)
    });

    const transformed = await real.query("select $1::int4 as n", [5]);
    const values = await real.query("select 1 as a, 'x' as b").useValueRows();
    const raw = await real.query("select 1 as a").useRawRows();
    const each: unknown[] = [];
    await real.query("select generate_series(1, 3) as n").forEach(row => each.push(row));
    const ended = await real.endAsync();

    Assert.areEqual(JSON.stringify([{ wrapped: { N: 5 } }]), JSON.stringify(transformed));
    Assert.areEqual(JSON.stringify([{ wrapped: [1, "x"] }]), JSON.stringify(values));
    Assert.areEqual(3, each.length);
    Assert.isTrue(debugged.includes("select $1::int4 as n"));
    Assert.isDefined(raw);
    Assert.isTrue(ended);
  }

  @TestMethod
  public async closesIdleConnectionsAndEndsWithATimeoutAsync(): Promise<void> {
    await using real = new RealPool({ max: 3 });

    await Promise.all([real.rowsAsync("select pg_sleep(0.01)"), real.rowsAsync("select pg_sleep(0.01)"), real.rowsAsync("select pg_sleep(0.01)")]);
    await real.pool.closeAsync();
    const after = await real.rowsAsync("select 1 as n");
    const sleeping = Assert.throwsAsync(async () => {
      await real.query("select pg_sleep(30)");
    }, Error);
    await real.pool.endAsync(0.05);
    const error = await sleeping;
    const refused = await Assert.throwsAsync(async () => {
      await real.query("select 1");
    }, Error);

    Assert.areEqual(JSON.stringify([{ n: 1 }]), JSON.stringify(after));
    Assert.isTrue(error.message.length > 0);
    Assert.isTrue(refused.message.length > 0);
    Assert.isTrue(await real.endAsync());
  }

  @TestMethod
  public async readsAReusedStatementInBinaryAsync(): Promise<void> {
    await using real = new RealPool({ max: 1 });
    const text = "select $1::int4[] as ints, $2::bytea as bytes, $3::text as t";
    const values = [[1, 2], Buffer.from([9]), "x"];

    const first = await real.query(text, values);
    const second = await real.query(text, values);
    const raw = await real.query(text, values).useRawRows();
    const parsed = await real.query(text, values).useParsers(new Map([[25, (value: string) => value.toUpperCase()]]));
    const ended = await real.endAsync();

    const expected = JSON.stringify([{ ints: [1, 2], bytes: { type: "Buffer", data: [9] }, t: "x" }]);
    Assert.areEqual(expected, JSON.stringify(first));
    Assert.areEqual(expected, JSON.stringify(second));
    Assert.areEqual(1, RealPool.result(raw).length);
    Assert.areEqual(JSON.stringify([{ ints: [1, 2], bytes: { type: "Buffer", data: [9] }, t: "X" }]), JSON.stringify(parsed));
    Assert.isTrue(ended);
  }

  @TestMethod
  public async sendsLooseParametersOfMixedTypesAsync(): Promise<void> {
    await using real = new RealPool({ max: 1 });

    const rows = await real.query("select $1::int4 as a, $2::int4 as b, $3::int4 as c", [null, 5, 7], [0, 23, 0]);
    const again = await real.query("select $1::int4 as a, $2::int4 as b, $3::int4 as c", [1, null, 3], [0, 23, 0]);
    const ended = await real.endAsync();

    Assert.areEqual(JSON.stringify([{ a: null, b: 5, c: 7 }]), JSON.stringify(rows));
    Assert.areEqual(JSON.stringify([{ a: 1, b: null, c: 3 }]), JSON.stringify(again));
    Assert.isTrue(ended);
  }

  @TestMethod
  public async refusesMoreValuesThanTheStatementTakesAsync(): Promise<void> {
    await using real = new RealPool({ max: 2 });
    const lease = await real.pool.acquireLeaseAsync(LeaseKind.Reserve);

    const described = await Assert.throwsAsync(async () => {
      await real.query("select $1::text as t", ["a", "b"]);
    }, DataException);
    const leased = await Assert.throwsAsync(async () => {
      await real.query("select $1::text as t", ["a", "b"], [], lease);
    }, Error);
    const typed = await Assert.throwsAsync(async () => {
      await real.query("select $1::int4 as n", [1, 2], [23, 0]);
    }, Error);
    const after = await real.leased(lease, "select 1 as n");
    lease.release();
    const ended = await real.endAsync();

    Assert.isTrue(described.message.length > 0);
    Assert.isTrue(leased.message.length > 0);
    Assert.isTrue(typed.message.length > 0);
    Assert.areEqual(JSON.stringify([{ n: 1 }]), JSON.stringify(after));
    Assert.isTrue(ended);
  }

  @TestMethod
  public async skipsTheRestOfABatchWhosePartCannotBeSentAsync(): Promise<void> {
    await using real = new RealPool({ max: 1 });

    const typed = await Assert.throwsAsync(async () => {
      await real.batch(real.query("select 1 as n"), real.query("select $1::int4 as n", [1, 2], [23]), real.query("select 3 as n"));
    }, BatchException);
    const described = await Assert.throwsAsync(async () => {
      await real.batch(real.query("select 1 as n"), real.query("select $1::text as t", ["a", "b"]), real.query("select 3 as n"));
    }, BatchException);
    const after = await real.rowsAsync("select 4 as n");
    const ended = await real.endAsync();

    Assert.areEqual(1, typed.index);
    Assert.isInstanceOf(typed.cause, DataException);
    Assert.areEqual(1, described.index);
    Assert.isInstanceOf(described.cause, DataException);
    Assert.areEqual(JSON.stringify([{ n: 4 }]), JSON.stringify(after));
    Assert.isTrue(ended);
  }

  @TestMethod
  public async readsACursorWithParametersAsync(): Promise<void> {
    await using real = new RealPool({ max: 1 });
    const sizes: number[] = [];

    await real.query("select generate_series(1, $1) as n", [5]).useCursor(2, rows => {
      sizes.push(rows.length);
    });
    const ended = await real.endAsync();

    Assert.areEqual("2,2,1", sizes.join());
    Assert.isTrue(ended);
  }

  @TestMethod
  public async timesOutAQueryQueuedBehindASlowOneAsync(): Promise<void> {
    await using real = new RealPool({ max: 1, queryTimeout: PostgreSQLPoolServerTests.QUERY_TIMEOUT_SECONDS });
    let errors: QueryTimeoutException[];
    let after: Result;
    let ended = false;
    try {
      await PostgreSQLPoolServerTests.openAsync(real);
      errors = await Promise.all([
        Assert.throwsAsync(async () => {
          await real.query("select pg_sleep(30)");
        }, QueryTimeoutException),
        Assert.throwsAsync(async () => {
          await real.query("select pg_sleep(30)");
        }, QueryTimeoutException)
      ]);
      after = await PostgreSQLPoolServerTests.selectOneOnceFreeAsync(real);
    }
    finally {
      ended = await real.endAsync();
    }

    Assert.areEqual(2, errors.length);
    Assert.areEqual(JSON.stringify([{ n: 1 }]), JSON.stringify(after));
    Assert.isTrue(ended);
  }

  @TestMethod
  public async refusesAValueItCannotSerializeOnceTheServerDescribedItAsync(): Promise<void> {
    await using real = new RealPool({ max: 2 });
    const circular = { self: {} };
    circular.self = circular;
    const lease = await real.pool.acquireLeaseAsync(LeaseKind.Reserve);

    const alone = await Assert.throwsAsync(async () => {
      await real.query("select $1::jsonb as doc", [circular]);
    }, TypeError);
    const leased = await Assert.throwsAsync(async () => {
      await real.query("select $1::jsonb as doc", [circular], [], lease);
    }, TypeError);
    const batched = await Assert.throwsAsync(async () => {
      await real.batch(real.query("select 1 as n"), real.query("select $1::jsonb as doc", [circular]), real.query("select 3 as n"));
    }, BatchException);
    const after = await real.leased(lease, "select 1 as n");
    lease.release();
    const ended = await real.endAsync();

    Assert.isTrue(alone.message.length > 0);
    Assert.isTrue(leased.message.length > 0);
    Assert.isInstanceOf(batched.cause, TypeError);
    Assert.areEqual(JSON.stringify([{ n: 1 }]), JSON.stringify(after));
    Assert.isTrue(ended);
  }

  @TestMethod
  public async describesTheStatementAQueryRanAsync(): Promise<void> {
    await using real = new RealPool();
    const query = real.query("select $1::int4 as n", [1]);

    await query;
    const statement = query.statement;
    const ended = await real.endAsync();

    Assert.isInstanceOf(statement, StatementDescription);
    Assert.areEqual("select $1::int4 as n", statement?.text);
    Assert.isTrue(ended);
  }

  private static async openAsync(real: RealPool): Promise<void> {
    (await real.pool.acquireLeaseAsync(LeaseKind.Reserve)).release();
  }

  private static async selectOneOnceFreeAsync(real: RealPool): Promise<Result> {
    const lease = await real.pool.acquireLeaseAsync(LeaseKind.Reserve);
    try {
      return RealPool.result(await real.leased(lease, "select 1 as n"));
    }
    finally {
      lease.release();
    }
  }

  private static describe(error: Error): string {
    return `${error.constructor.name}:${error instanceof PostgreSQLException ? error.sqlState : ""}:${error.message}`;
  }

  private static async untilRunningAsync(watcher: RealPool, tag: string): Promise<void> {
    for (let attempt = 0; attempt < 1000; attempt += 1) {
      const rows = await watcher.rowsAsync(
        "select count(*)::int4 as n from pg_stat_activity where state = 'active' and pid <> pg_backend_pid() and query like $1", [`%'${tag}'%`]);
      if (JSON.stringify(rows) === JSON.stringify([{ n: 1 }]))
        return;
    }

    Assert.fail(`The query tagged ${tag} never showed as running.`);
  }
}
