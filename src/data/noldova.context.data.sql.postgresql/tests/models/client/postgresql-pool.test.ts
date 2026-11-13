/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { DataException } from "@noldova/context.data";
import { LeaseKind } from "@noldova/context.data.sql.postgresql/enums/lease-kind.js";
import { BatchException } from "@noldova/context.data.sql.postgresql/exceptions/batch.exception.js";
import { ConnectionClosedException } from "@noldova/context.data.sql.postgresql/exceptions/connection-closed.exception.js";
import { ConnectionEndedException } from "@noldova/context.data.sql.postgresql/exceptions/connection-ended.exception.js";
import { PostgreSQLException } from "@noldova/context.data.sql.postgresql/exceptions/postgresql.exception.js";
import { QueryCanceledException } from "@noldova/context.data.sql.postgresql/exceptions/query-canceled.exception.js";
import { QueryTimeoutException } from "@noldova/context.data.sql.postgresql/exceptions/query-timeout.exception.js";
import { QueueTimeoutException } from "@noldova/context.data.sql.postgresql/exceptions/queue-timeout.exception.js";
import { TypeNotFoundException } from "@noldova/context.data.sql.postgresql/exceptions/type-not-found.exception.js";
import { UnsafeTransactionException } from "@noldova/context.data.sql.postgresql/exceptions/unsafe-transaction.exception.js";
import { BuiltQuery } from "@noldova/context.data.sql.postgresql/models/built-query.js";
import { Result } from "@noldova/context.data.sql.postgresql/models/result.js";
import { StatementDescription } from "@noldova/context.data.sql.postgresql/models/statement-description.js";
import { TypeDefinition } from "@noldova/context.data.sql.postgresql/models/type-definition.js";
import { TypeRegistry } from "@noldova/context.data.sql.postgresql/models/type-registry.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { BackendMessages as M } from "../../fixtures/backend-messages.fixture.js";
import { FailingQuery } from "../../fixtures/failing-query.fixture.js";
import { PoolHarness } from "../../fixtures/pool-harness.fixture.js";

@TestClass
export class PostgreSQLPoolTests {
  @TestMethod
  public async runsQueriesOnAnOpenedConnectionAsync(): Promise<void> {
    const changes: string[] = [];
    const notifications: string[] = [];
    const harness = new PoolHarness({
      onparameter: (name, value) => changes.push(`${name}=${value}`),
      onnotify: (channel, payload, pid) => notifications.push(`${channel}:${payload}:${pid}`)
    });
    const first = harness.query("select 1").execute();

    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    harness.answer(0, M.parameterStatus("server_version", "17"), M.parameterStatus("TimeZone", "UTC"), M.notification(5, "jobs", "go"),
      ...PoolHarness.prepared());
    Assert.isInstanceOf(await first, Result);

    const second = harness.query("select 1").execute();
    Assert.areEqual("B,E,S", await harness.writtenAsync(0));
    harness.answer(0, M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery());
    Assert.isInstanceOf(await second, Result);

    const stats = harness.pool.stats;
    Assert.areEqual(1, harness.starters.length);
    Assert.areEqual(1, stats.connections);
    Assert.areEqual(0, stats.opening);
    Assert.areEqual(1, stats.idle);
    Assert.areEqual(0, stats.leased);
    Assert.areEqual(0, stats.waiting);
    Assert.areEqual("server_version=17,TimeZone=UTC", changes.join());
    Assert.areEqual("UTC", harness.pool.parameters.get("TimeZone"));
    Assert.areEqual("jobs:go:5", notifications.join());
  }

  @TestMethod
  public delegatesTypesToTheRegistry(): void {
    const harness = new PoolHarness({ fetchTypes: true });
    const pool = harness.pool;

    Assert.isFalse(pool.typed);
    Assert.isTrue(pool.plain);
    Assert.isTrue(pool.hasUnknownTypes([16400]));
    Assert.isTrue(pool.options === harness.options);
    Assert.isTrue(pool.findParser(23) === harness.registry.findParser(23));
    Assert.isTrue(pool.findSerializer(16) === harness.registry.findSerializer(16));
    Assert.isTrue(pool.findDecoder(23, TypeRegistry.number) === harness.registry.findDecoder(23, TypeRegistry.number));
    Assert.isTrue(pool.findBinaryDecoder(1007) === harness.registry.findBinaryDecoder(1007));
    Assert.isTrue(new PoolHarness().pool.typed);
    Assert.isFalse(new PoolHarness().pool.hasUnknownTypes([16400]));
  }

  @TestMethod
  public async pipelinesOnTheOnlyConnectionAsync(): Promise<void> {
    const harness = new PoolHarness({ max: 1 });
    const first = harness.query("select 1").execute();
    const second = harness.query("select 2").execute();

    Assert.areEqual("P,D,B,E,S,P,D,B,E,S", await harness.writtenAsync(0));
    harness.answer(0, ...PoolHarness.prepared(), ...PoolHarness.prepared());

    Assert.isInstanceOf(await first, Result);
    Assert.isInstanceOf(await second, Result);
    Assert.areEqual(1, harness.starters.length);
  }

  @TestMethod
  public async limitsPipeliningWhileConnectionsOpenAsync(): Promise<void> {
    const harness = new PoolHarness({ max: 2 });
    harness.automatic = false;
    for (let index = 1; index <= 6; index += 1)
      harness.query("select " + String(index)).execute();
    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.waiting === 6 && harness.starters.length === 2));

    harness.starter(0).open();
    Assert.areEqual("P,D,B,E,S,P,D,B,E,S", await harness.writtenAsync(0));
    Assert.areEqual(4, harness.pool.stats.waiting);

    harness.answer(0, ...PoolHarness.prepared());
    Assert.areEqual("P,D,B,E,S,P,D,B,E,S", await harness.writtenAsync(0));
    Assert.areEqual(2, harness.pool.stats.waiting);

    harness.starter(1).open();
    Assert.areEqual("P,D,B,E,S,P,D,B,E,S", await harness.writtenAsync(1));
    Assert.areEqual(0, harness.pool.stats.waiting);
  }

  @TestMethod
  public async refusesQueriesWhileCopyHoldsEveryConnectionAsync(): Promise<void> {
    const harness = new PoolHarness({ max: 1 });
    const copy = harness.query("copy t from stdin");
    const stream = copy.openWritableAsync();
    Assert.areEqual("Q", await harness.writtenAsync(0));
    harness.answer(0, M.copyIn());
    Assert.isNotNull(await stream);

    const query = harness.query("select 1");
    await Assert.throwsAsync(async () => {
      await query;
    }, DataException);
    Assert.areEqual(0, harness.pool.stats.waiting);
  }

  @TestMethod
  public async timesOutAQueuedQueryAsync(): Promise<void> {
    const harness = new PoolHarness({ queueTimeout: 1 });
    harness.automatic = false;
    const query = harness.query("select 1");
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, QueueTimeoutException);
    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.waiting === 1));

    harness.timers.advance(1000);

    const timedOut = await rejected;
    Assert.areEqual(1, timedOut.seconds);
    Assert.areEqual("QueueTimeoutException", timedOut.name);
    Assert.areEqual(1, harness.timers.unreferenced.length);
    Assert.areEqual(0, harness.pool.stats.waiting);
  }

  @TestMethod
  public async cancelsQueuedRunningAndUnplacedQueriesAsync(): Promise<void> {
    const harness = new PoolHarness();
    harness.automatic = false;
    const running = harness.query("select 1").execute();
    const queued = harness.query("select 2").execute();
    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.waiting === 2));
    const canceled = Assert.throwsAsync(async () => {
      await queued;
    }, QueryCanceledException);

    await queued.cancelAsync();
    await canceled;
    Assert.areEqual(1, harness.pool.stats.waiting);

    harness.starter(0).open();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    const failed = Assert.throwsAsync(async () => {
      await running;
    }, PostgreSQLException);
    await running.cancelAsync();
    Assert.areEqual(1, harness.starter(0).cancelled.length);
    harness.answer(0, M.error("57014", "canceling statement due to user request"), M.readyForQuery());
    Assert.areEqual("57014", (await failed).sqlState);

    const unplaced = harness.query("select 3");
    await harness.pool.cancelAsync(unplaced);
    Assert.isTrue(unplaced.cancelled);
    await Assert.throwsAsync(async () => {
      await unplaced;
    }, QueryCanceledException);
  }

  @TestMethod
  public async cancelsAQueryThatRunsPastTheQueryTimeoutAsync(): Promise<void> {
    const harness = new PoolHarness({ queryTimeout: 1 });
    const query = harness.query("select pg_sleep(5)");
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, QueryTimeoutException);
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    harness.starter(0).cancelError = new DataException("The cancel request was refused.");

    harness.timers.advance(1000);
    Assert.isTrue(await harness.untilAsync(() => harness.starter(0).cancelled.length === 1));
    harness.answer(0, M.error("57014", "canceling statement due to statement timeout"), M.readyForQuery());

    Assert.areEqual(1, (await rejected).seconds);
    Assert.isTrue(query.timedOut);
  }

  @TestMethod
  public async endsOnlyOnceATimedOutQuerysCancelRequestSettlesAsync(): Promise<void> {
    const harness = new PoolHarness({ queryTimeout: 1 });
    const query = harness.query("select pg_sleep(5)");
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, QueryTimeoutException);
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    const cancel = Promise.withResolvers<void>();
    harness.starter(0).cancelPending = cancel.promise;
    harness.timers.advance(1000);
    Assert.isTrue(await harness.untilAsync(() => harness.starter(0).cancelled.length === 1));
    harness.answer(0, M.error("57014", "canceling statement due to statement timeout"), M.readyForQuery());
    await rejected;

    let ended = false;
    const ending = harness.pool.endAsync().then(() => {
      ended = true;
    });
    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.connections === 0));
    Assert.isFalse(await harness.untilAsync(() => ended));
    cancel.resolve();
    await ending;

    Assert.isTrue(ended);
  }

  @TestMethod
  public async runsABatchAsync(): Promise<void> {
    const harness = new PoolHarness();
    const batch = harness.query("");
    batch.parts = [harness.query("select 1"), harness.query("select 2")];
    batch.execute();

    Assert.areEqual("P,D,B,E,P,D,B,E,S", await harness.writtenAsync(0));
    harness.answer(0, M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"),
      ...PoolHarness.prepared());

    const results = await batch;
    Assert.isTrue(Array.isArray(results));
    Assert.areEqual("[[],[]]", JSON.stringify(results));
  }

  @TestMethod
  public async resolvesAnEmptyBatchAsync(): Promise<void> {
    const harness = new PoolHarness();
    const batch = harness.query("");
    batch.parts = [];

    Assert.areEqual("[]", JSON.stringify(await batch));
    Assert.areEqual(0, harness.starters.length);
  }

  @TestMethod
  public async rejectsABatchWhosePartCannotBeBuiltAsync(): Promise<void> {
    const harness = new PoolHarness();
    const batch = harness.query("");
    batch.parts = [harness.query("select 1"), new FailingQuery(new BuiltQuery("select 2", [], []), harness.pool)];

    const error = await Assert.throwsAsync(async () => {
      await batch;
    }, BatchException);

    Assert.areEqual(1, error.index);
    Assert.areEqual(0, harness.starters.length);
  }

  @TestMethod
  public async rejectsAQueryThatCannotBeBuiltAsync(): Promise<void> {
    const harness = new PoolHarness();
    const query = new FailingQuery(new BuiltQuery("select 1", [], []), harness.pool);

    const error = await Assert.throwsAsync(async () => {
      await query;
    }, DataException);

    Assert.areEqual("The query cannot be built.", error.message);
  }

  @TestMethod
  public async refusesALeasedDescribeThatReachesThePoolAfterTheReleaseAsync(): Promise<void> {
    const harness = new PoolHarness();
    const lease = await harness.pool.acquireLeaseAsync(LeaseKind.Reserve);
    const query = harness.leased(lease, "select 1").describe();

    lease.release();
    harness.pool.query(query, lease);

    await Assert.throwsAsync(() => query.promise, UnsafeTransactionException);
    Assert.areEqual(0, harness.pool.stats.leased);
  }

  @TestMethod
  public async describesAStatementAsync(): Promise<void> {
    const harness = new PoolHarness();
    const query = harness.query("select $1::int as x", [], [0]).describe().execute();

    Assert.areEqual("P,D,S", await harness.writtenAsync(0));
    harness.answer(0, M.parseComplete(), M.parameterDescription([23]), M.rowDescription([["x", 23]]), M.readyForQuery());

    const description = await query;
    Assert.isInstanceOf(description, StatementDescription);
    Assert.areEqual("23", description.types.join());
    Assert.areEqual("x", description.columns[0]?.name);
    Assert.areEqual("select $1::int as x", description.text);
  }

  @TestMethod
  public async describesAStatementTheServerSentNoShapeForAsync(): Promise<void> {
    const harness = new PoolHarness();
    const query = harness.query("select 1").describe().execute();

    Assert.areEqual("P,D,S", await harness.writtenAsync(0));
    harness.answer(0, M.parseComplete(), M.readyForQuery());

    const description = await query;
    Assert.isInstanceOf(description, StatementDescription);
    Assert.areEqual(0, description.types.length);
    Assert.areEqual(0, description.columns.length);
  }

  @TestMethod
  public async runsQueriesWithEagerTypesWhenItFetchesNoTypesAsync(): Promise<void> {
    const harness = new PoolHarness({ eagerTypes: true });
    const query = harness.query("select 1").execute();

    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    harness.answer(0, ...PoolHarness.prepared());

    Assert.isInstanceOf(await query, Result);
    Assert.areEqual(1, harness.starters.length);
  }

  @TestMethod
  public async rejectsADescriptionTheServerRefusesAsync(): Promise<void> {
    const harness = new PoolHarness();
    const query = harness.query("selec 1").describe();
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, PostgreSQLException);

    Assert.areEqual("P,D,S", await harness.writtenAsync(0));
    harness.answer(0, M.error("42601", "syntax error"), M.readyForQuery());

    Assert.areEqual("42601", (await rejected).sqlState);
  }

  @TestMethod
  public async endsAfterTheRunningQueriesAsync(): Promise<void> {
    const closed: number[] = [];
    const harness = new PoolHarness({ onclose: connection => closed.push(connection) });
    const query = harness.query("select 1").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));

    const ending = harness.pool.endAsync();
    Assert.isTrue(harness.pool.endAsync() === ending);
    const ended = await Assert.throwsAsync(async () => {
      await harness.query("select 2");
    }, ConnectionEndedException);
    Assert.areEqual("ConnectionEndedException", ended.name);
    await Assert.throwsAsync(() => harness.pool.acquireLeaseAsync(LeaseKind.Reserve), ConnectionEndedException);
    Assert.isNull(harness.socket(0).ended);

    harness.answer(0, ...PoolHarness.prepared());
    await ending;

    Assert.isInstanceOf(await query, Result);
    Assert.isNotNull(harness.socket(0).ended);
    Assert.areEqual(1, closed.length);
    Assert.areEqual(0, harness.pool.stats.connections);
  }

  @TestMethod
  public async endsAnIdlePoolAsync(): Promise<void> {
    const harness = new PoolHarness();
    const query = harness.query("select 1").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    harness.answer(0, ...PoolHarness.prepared());
    await query;

    await harness.pool.endAsync();

    Assert.isNotNull(harness.socket(0).ended);
    await new PoolHarness().pool.endAsync();
  }

  @TestMethod
  public async dropsAConnectionThatOpensAfterTheEndAsync(): Promise<void> {
    const harness = new PoolHarness();
    harness.automatic = false;
    const query = harness.query("select 1");
    const canceled = Assert.throwsAsync(async () => {
      await query;
    }, QueryCanceledException);
    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.waiting === 1));
    await query.cancelAsync();
    await canceled;

    const ending = harness.pool.endAsync();
    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.opening === 1));
    harness.starter(0).open();
    await ending;

    Assert.isTrue(harness.socket(0).destroyed);
    Assert.areEqual(0, harness.pool.stats.connections);
  }

  @TestMethod
  public async destroysThePoolAfterTheEndTimeoutAsync(): Promise<void> {
    const harness = new PoolHarness();
    const lease = await harness.pool.acquireLeaseAsync(LeaseKind.Reserve);
    const running = harness.query("select 1");
    const runningRejected = Assert.throwsAsync(async () => {
      await running;
    }, ConnectionClosedException);
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(1));
    harness.automatic = false;
    const queued = harness.query("select 2");
    const queuedRejected = Assert.throwsAsync(async () => {
      await queued;
    }, ConnectionClosedException);
    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.waiting === 1 && harness.starters.length === 3));

    const ending = harness.pool.endAsync(1);
    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.connections === 2));
    harness.timers.advance(1000);
    await ending;

    Assert.isTrue(harness.starter(2).stopped);
    Assert.isTrue((await queuedRejected).destroyed);
    Assert.isTrue((await runningRejected).destroyed);
    const lost = await Assert.throwsAsync(() => lease.closed, ConnectionClosedException);
    Assert.isFalse(lost.destroyed);
    Assert.isTrue(lease.error === lost);
    Assert.areEqual(0, harness.pool.stats.connections);
  }

  @TestMethod
  public async rejectsWaitingQueriesWhenEndingBetweenRetriesAsync(): Promise<void> {
    const harness = new PoolHarness();
    harness.automatic = false;
    const query = harness.query("select 1");
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, ConnectionEndedException);
    Assert.isTrue(await harness.untilAsync(() => harness.starters.length === 1));

    harness.starter(0).fail(new ConnectionClosedException(false, "localhost", 5432, null));
    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.opening === 0));
    Assert.areEqual(1, harness.pool.stats.waiting);
    await harness.pool.endAsync();

    Assert.areEqual("localhost", (await rejected).host);
  }

  @TestMethod
  public async retriesAfterTheBackoffUntilTheConnectTimeoutAsync(): Promise<void> {
    const harness = new PoolHarness({}, 1);
    harness.automatic = false;
    const first = harness.query("select 1");
    const firstRejected = Assert.throwsAsync(async () => {
      await first;
    }, ConnectionClosedException);
    Assert.isTrue(await harness.untilAsync(() => harness.starters.length === 1));

    harness.starter(0).fail(new PostgreSQLException(new Map([["code", "53300"], ["message", "too many clients"]])));
    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.opening === 0));
    Assert.areEqual(1, harness.pool.stats.waiting);
    harness.timers.advance(1000);
    Assert.isTrue(await harness.untilAsync(() => harness.starters.length === 2));
    harness.starter(1).fail(new ConnectionClosedException(false, "localhost", 5432, null));
    await firstRejected;

    const failing = await Assert.throwsAsync(async () => {
      await harness.query("select 2");
    }, ConnectionClosedException);
    Assert.isFalse(failing.destroyed);
    await Assert.throwsAsync(() => harness.pool.acquireLeaseAsync(LeaseKind.Reserve), ConnectionClosedException);

    harness.timers.advance(1000);
    harness.automatic = true;
    const recovered = harness.query("select 3").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(2));
    harness.answer(2, ...PoolHarness.prepared());
    Assert.isInstanceOf(await recovered, Result);
  }

  @TestMethod
  public async rejectsWaitingQueriesWhenTheServerRefusesAsync(): Promise<void> {
    const harness = new PoolHarness();
    harness.automatic = false;
    const query = harness.query("select 1");
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, DataException);
    Assert.isTrue(await harness.untilAsync(() => harness.starters.length === 1));

    harness.starter(0).fail("refused");

    await rejected;
    Assert.areEqual(0, harness.pool.stats.waiting);
  }

  @TestMethod
  public async closesAConnectionIdleLongerThanTheIdleTimeoutAsync(): Promise<void> {
    const harness = new PoolHarness({ idleTimeout: 1 });
    const first = harness.query("select 1").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    harness.answer(0, ...PoolHarness.prepared());
    await first;

    harness.timers.advance(500);
    const second = harness.query("select 2").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    harness.answer(0, ...PoolHarness.prepared());
    await second;
    harness.timers.advance(500);
    Assert.isNull(harness.socket(0).ended);

    harness.timers.advance(500);

    Assert.isNotNull(harness.socket(0).ended);
    Assert.areEqual(0, harness.pool.stats.connections);
  }

  @TestMethod
  public async keepsBusyAndMinimumConnectionsOpenAsync(): Promise<void> {
    const harness = new PoolHarness({ idleTimeout: 1, min: 1 });
    const query = harness.query("select 1").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));

    harness.timers.advance(1000);
    harness.answer(0, ...PoolHarness.prepared());
    await query;
    harness.timers.advance(1000);

    Assert.isNull(harness.socket(0).ended);
    Assert.areEqual(1, harness.pool.stats.connections);
  }

  @TestMethod
  public async retiresAConnectionAfterItsLifetimeAsync(): Promise<void> {
    const harness = new PoolHarness({ maxLifetime: () => 1, unrefSockets: true });
    const first = harness.query("select 1").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    harness.answer(0, ...PoolHarness.prepared());
    await first;
    Assert.isFalse(harness.socket(0).referenced);

    const second = harness.query("select 2").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    Assert.isTrue(harness.socket(0).referenced);
    harness.timers.advance(1000);
    Assert.isNull(harness.socket(0).ended);
    harness.answer(0, ...PoolHarness.prepared());
    await second;

    Assert.isNotNull(harness.socket(0).ended);
    Assert.areEqual(1, harness.timers.unreferenced.length);
  }

  @TestMethod
  public async retiresAnIdleConnectionAtOnceAsync(): Promise<void> {
    const harness = new PoolHarness({ maxLifetime: 1 });
    const query = harness.query("select 1").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    harness.answer(0, ...PoolHarness.prepared());
    await query;

    harness.timers.advance(1000);

    Assert.isNotNull(harness.socket(0).ended);
  }

  @TestMethod
  public async closesAfterTheLeasesAreReleasedAsync(): Promise<void> {
    const harness = new PoolHarness();
    const lease = await harness.pool.acquireLeaseAsync(LeaseKind.Reserve);
    const query = harness.query("select 1").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(1));
    harness.answer(1, ...PoolHarness.prepared());
    await query;

    let closed = false;
    const closing = harness.pool.closeAsync().then(() => {
      closed = true;
    });
    Assert.isTrue(await harness.untilAsync(() => !Object.isNull(harness.socket(1).ended)));
    Assert.isFalse(closed);
    Assert.isNull(harness.socket(0).ended);

    lease.release();
    await closing;

    Assert.isNotNull(harness.socket(0).ended);
    Assert.areEqual(0, harness.pool.stats.connections);
  }

  @TestMethod
  public async loadsTypesEagerlyBeforeLeasingAsync(): Promise<void> {
    const harness = new PoolHarness({ fetchTypes: true, eagerTypes: true, queryTimeout: 1 });
    const leasing = harness.pool.acquireLeaseAsync(LeaseKind.Reserve);

    Assert.areEqual("Q", await harness.writtenAsync(0));
    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.connections === 2));
    harness.answer(0, M.commandComplete("SELECT 0"), M.commandComplete("SELECT 0"), M.readyForQuery());
    const lease = await leasing;

    Assert.isTrue(harness.pool.typed);
    Assert.isNull(lease.connection.typing);
    Assert.areEqual(1, harness.pool.stats.leased);
    Assert.areEqual(0, harness.timers.scheduled);
  }

  @TestMethod
  public async cancelsATypesQueryPastTheQueryTimeoutAsync(): Promise<void> {
    const harness = new PoolHarness({ fetchTypes: true, eagerTypes: true, queryTimeout: 1 });
    const leasing = harness.pool.acquireLeaseAsync(LeaseKind.Reserve);
    Assert.areEqual("Q", await harness.writtenAsync(0));

    harness.timers.advance(1000);
    Assert.isTrue(await harness.untilAsync(() => harness.starter(0).cancelled.length === 1));
    harness.answer(0, M.error("57014", "canceling statement due to user request"), M.readyForQuery());

    Assert.isNotNull(await leasing);
    Assert.isTrue(harness.pool.typed);
  }

  @TestMethod
  public async runsQueriesBehindTheTypesQueryAsync(): Promise<void> {
    const harness = new PoolHarness({ fetchTypes: true, eagerTypes: true });
    const query = harness.query("select 1").execute();

    Assert.areEqual("Q,P,D,B,E,S", await harness.writtenAsync(0));
    harness.answer(0, M.error("42501", "permission denied for table pg_type"), M.readyForQuery(), ...PoolHarness.prepared());

    Assert.isInstanceOf(await query, Result);
    Assert.isTrue(await harness.untilAsync(() => harness.pool.typed));
  }

  @TestMethod
  public async rejectsQueriesWhileANamedTypeIsMissingAsync(): Promise<void> {
    const harness = new PoolHarness({ fetchTypes: true, types: [new TypeDefinition("nope", ["nope"], null, null)] });
    const first = harness.query("select 1");
    const firstRejected = Assert.throwsAsync(async () => {
      await first;
    }, TypeNotFoundException);

    Assert.areEqual("Q,Q", await harness.writtenAsync(0));
    harness.answer(0, ...PoolHarness.done(), ...PoolHarness.done());
    const notFound = await firstRejected;
    Assert.areEqual("nope", notFound.names.join());
    Assert.areEqual("TypeNotFoundException", notFound.name);

    await Assert.throwsAsync(() => harness.pool.acquireLeaseAsync(LeaseKind.Reserve), TypeNotFoundException);
    await Assert.throwsAsync(async () => {
      await harness.query("select 2");
    }, TypeNotFoundException);

    harness.timers.advance(1000);
    const third = harness.query("select 3").execute();
    Assert.areEqual("Q,Q", await harness.writtenAsync(0));
    harness.answer(0, ...PoolHarness.done(),
      M.rowDescription([["oid", 23], ["array", 23], ["delimiter", 25], ["name", 25], ["schema", 25], ["visible", 16]]),
      M.dataRow(["16400", "16401", ",", "nope", "public", "t"]), M.commandComplete("SELECT 1"), M.readyForQuery());
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    harness.answer(0, ...PoolHarness.prepared());

    Assert.isInstanceOf(await third, Result);
    Assert.areEqual(16400, harness.registry.resolve("nope"));
  }

  @TestMethod
  public async loadsTypesOnTheNextConnectionWhenOneClosesAsync(): Promise<void> {
    const harness = new PoolHarness({ fetchTypes: true, eagerTypes: true, backoff: () => 1 });
    const first = harness.pool.acquireLeaseAsync(LeaseKind.Reserve);
    const second = harness.pool.acquireLeaseAsync(LeaseKind.Reserve);
    Assert.areEqual("Q", await harness.writtenAsync(0));
    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.connections === 3));

    harness.socket(0).close(null);
    Assert.areEqual("Q", await harness.writtenAsync(1));
    harness.answer(1, ...PoolHarness.done());

    const leases = await Promise.all([first, second]);
    Assert.isFalse(leases[0].connection === leases[1].connection);
    Assert.areEqual(2, harness.pool.stats.leased);
    Assert.areEqual(3, harness.starters.length);
  }

  @TestMethod
  public async loadsTypesOnASeparateConnectionAsync(): Promise<void> {
    const harness = new PoolHarness({ fetchTypes: true });
    const query = harness.query("select $1", [1], [16400]).execute();

    Assert.areEqual("Q", await harness.writtenAsync(0));
    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.connections === 1));
    harness.answer(0, M.rowDescription([["oid", 23], ["element", 23], ["delimiter", 25], ["base", 23], ["kind", 25]]),
      M.dataRow(["16400", "0", ",", "23", "d"]), M.commandComplete("SELECT 1"), M.readyForQuery());
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(1));
    harness.answer(1, ...PoolHarness.prepared());

    Assert.isInstanceOf(await query, Result);
    Assert.isNotNull(harness.socket(0).ended);
    Assert.isTrue(harness.pool.typed);
  }

  @TestMethod
  public async endsOnlyOnceASeparateTypeLoadSettlesAsync(): Promise<void> {
    const harness = new PoolHarness({ fetchTypes: true });
    const query = harness.query("select $1", [1], [16400]);
    const canceled = Assert.throwsAsync(async () => {
      await query;
    }, QueryCanceledException);
    Assert.areEqual("Q", await harness.writtenAsync(0));
    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.connections === 1));
    await query.cancelAsync();
    await canceled;

    let ended = false;
    const ending = harness.pool.endAsync().then(() => {
      ended = true;
    });
    Assert.isFalse(await harness.untilAsync(() => ended));
    harness.answer(0, M.rowDescription([["oid", 23], ["element", 23], ["delimiter", 25], ["base", 23], ["kind", 25]]),
      M.dataRow(["16400", "0", ",", "23", "d"]), M.commandComplete("SELECT 1"), M.readyForQuery());
    await ending;

    Assert.isNotNull(harness.socket(0).ended);
  }

  @TestMethod
  public async destroysASeparateTypeLoadWhenTheEndTimesOutAsync(): Promise<void> {
    const harness = new PoolHarness({ fetchTypes: true });
    const query = harness.query("select $1", [1], [16400]);
    const canceled = Assert.throwsAsync(async () => {
      await query;
    }, QueryCanceledException);
    Assert.areEqual("Q", await harness.writtenAsync(0));
    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.connections === 1));
    await query.cancelAsync();
    await canceled;

    const ending = harness.pool.endAsync(1);
    harness.timers.advance(1000);
    await ending;

    Assert.isTrue(harness.socket(0).destroyed);
  }

  @TestMethod
  public async loadsTypesOnAnIdleConnectionAsync(): Promise<void> {
    const harness = new PoolHarness({ fetchTypes: true });
    const plain = harness.query("select 0").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    harness.answer(0, ...PoolHarness.prepared());
    await plain;

    const typed = harness.query("select $1", [1], [16400]).execute();
    Assert.areEqual("Q", await harness.writtenAsync(0));
    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.connections === 2));
    harness.answer(0, M.error("42501", "permission denied for table pg_type"), M.readyForQuery());
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    harness.answer(0, ...PoolHarness.prepared());

    Assert.isInstanceOf(await typed, Result);
    Assert.isTrue(harness.pool.typed);
  }

  @TestMethod
  public async destroysAPausedConnectionWhenTypesCannotLoadAsync(): Promise<void> {
    const harness = new PoolHarness({ fetchTypes: true }, 1);
    const query = harness.query("select x");
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, ConnectionClosedException);
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    harness.automatic = false;

    harness.answer(0, M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 16400]]));
    Assert.isTrue(await harness.untilAsync(() => harness.starters.length === 2));
    harness.starter(1).fail("refused");
    Assert.isTrue(await harness.untilAsync(() => harness.timers.scheduled === 1));
    harness.timers.advance(1000);
    Assert.isTrue(await harness.untilAsync(() => harness.starters.length === 3));
    harness.starter(2).fail(new DataException("The server refused the connection."));

    const error = await rejected;
    Assert.isInstanceOf(error.cause, DataException);
    Assert.isTrue(harness.socket(0).destroyed);
  }

  @TestMethod
  public async resumesAPausedConnectionOnceTypesLoadAsync(): Promise<void> {
    const harness = new PoolHarness({ fetchTypes: true });
    const first = harness.query("select x").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    harness.automatic = false;
    harness.answer(0, M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 16400]]));
    Assert.isTrue(await harness.untilAsync(() => harness.starters.length === 2));
    harness.starter(1).fail(new DataException("The server refused the connection."));
    Assert.isTrue(await harness.untilAsync(() => harness.timers.scheduled === 1));

    harness.automatic = true;
    const second = harness.query("select $1", [1], [16400]).execute();
    Assert.areEqual("Q", await harness.writtenAsync(2));
    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.connections === 2));
    harness.answer(2, M.rowDescription([["oid", 23], ["element", 23], ["delimiter", 25], ["base", 23], ["kind", 25]]),
      M.dataRow(["16400", "0", ",", "23", "d"]), M.commandComplete("SELECT 1"), M.readyForQuery());
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(3));
    harness.answer(0, M.bindComplete(), M.dataRow(["5"]), M.commandComplete("SELECT 1"), M.readyForQuery());
    harness.answer(3, ...PoolHarness.prepared());

    Assert.areEqual("[{\"x\":5}]", JSON.stringify(await first));
    Assert.isInstanceOf(await second, Result);
    harness.timers.advance(1000);
    Assert.areEqual(4, harness.starters.length);
  }

  @TestMethod
  public async runsAQueryOnTheConnectionPreparedForItAsync(): Promise<void> {
    const harness = new PoolHarness({ min: 2, max: 2 });
    const warm = harness.query("select a").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.connections === 2));
    harness.answer(0, ...PoolHarness.prepared());
    await warm;

    harness.query("select a").execute();
    Assert.areEqual("B,E,S", await harness.writtenAsync(0));
    harness.query("select a").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(1));
    harness.query("select a").execute();

    Assert.areEqual("B,E,S", await harness.writtenAsync(0));
  }

  @TestMethod
  public async schedulesWorkOnTheSoonestConnectionAsync(): Promise<void> {
    const harness = new PoolHarness({ min: 2, max: 2 });
    await PostgreSQLPoolTests.warmAsync(harness);

    harness.query("select a").execute();
    Assert.areEqual("B,E,S", await harness.writtenAsync(0));
    harness.query("select a").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(1));
    harness.query("select s").execute();

    Assert.isTrue(await harness.untilAsync(() => harness.socket(0).written.length + harness.socket(1).written.length > 0));
    Assert.areEqual(0, harness.pool.stats.waiting);
  }

  @TestMethod
  public async keepsSlowWorkOffBusyConnectionsAsync(): Promise<void> {
    const harness = new PoolHarness({ min: 2, max: 2 });
    await PostgreSQLPoolTests.warmAsync(harness);

    harness.query("select u").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    harness.query("select a").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(1));
    harness.timers.advance(400);
    harness.query("select s").execute();
    harness.query("select a").execute();

    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.waiting === 0
      && harness.socket(0).written.length + harness.socket(1).written.length > 0));
  }

  @TestMethod
  public async runsUnnamedAndSimpleQueriesAsync(): Promise<void> {
    const harness = new PoolHarness({ prepare: false });
    const unnamed = harness.query("select 1").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    harness.answer(0, ...PoolHarness.prepared());
    Assert.isInstanceOf(await unnamed, Result);

    const simple = harness.query("select 2").useSimpleProtocol().execute();
    Assert.areEqual("Q", await harness.writtenAsync(0));
    harness.answer(0, ...PoolHarness.done());

    Assert.isInstanceOf(await simple, Result);
  }

  @TestMethod
  public async refusesATransactionOpenedOutsideALeaseAsync(): Promise<void> {
    const harness = new PoolHarness();
    const query = harness.query("begin").useSimpleProtocol();
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, UnsafeTransactionException);
    Assert.areEqual("Q", await harness.writtenAsync(0));

    harness.answer(0, M.commandComplete("BEGIN"), M.readyForQuery("T"));

    await rejected;
    Assert.areEqual("Q", await harness.writtenAsync(0));
  }

  @TestMethod
  public async runsABatchBeforeTypesLoadAsync(): Promise<void> {
    const harness = new PoolHarness({ fetchTypes: true });
    const batch = harness.query("");
    batch.parts = [harness.query("select $1", [1], [23])];
    batch.execute();

    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    harness.answer(0, ...PoolHarness.prepared());

    Assert.areEqual("[[]]", JSON.stringify(await batch));
  }

  @TestMethod
  public async rejectsWaitingQueriesWhenTheLastAttemptFailsWhileEndingAsync(): Promise<void> {
    const harness = new PoolHarness();
    harness.automatic = false;
    const query = harness.query("select 1");
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, ConnectionClosedException);
    Assert.isTrue(await harness.untilAsync(() => harness.starters.length === 1));
    const ending = harness.pool.endAsync();
    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.waiting === 1));

    harness.starter(0).fail(new ConnectionClosedException(false, "localhost", 5432, null));
    await ending;

    Assert.isFalse((await rejected).destroyed);
  }

  @TestMethod
  public async destroysAPoolThatHasNoConnectionsAsync(): Promise<void> {
    const harness = new PoolHarness();
    harness.automatic = false;
    const query = harness.query("select 1");
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, ConnectionClosedException);
    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.waiting === 1));
    const ending = harness.pool.endAsync(1);

    harness.timers.advance(1000);
    await ending;

    Assert.isTrue((await rejected).destroyed);
    Assert.isTrue(harness.starter(0).stopped);
  }

  private static async warmAsync(harness: PoolHarness): Promise<void> {
    const fast = harness.query("select a").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.connections === 2));
    harness.answer(0, ...PoolHarness.prepared());
    await fast;

    const slow = harness.query("select s").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    harness.timers.advance(150);
    harness.answer(0, ...PoolHarness.prepared());
    await slow;
  }
}
