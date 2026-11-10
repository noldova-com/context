/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";
import { LeaseKind } from "@noldova/context.data.sql.postgresql/enums/lease-kind.js";
import { ConnectionClosedException } from "@noldova/context.data.sql.postgresql/exceptions/connection-closed.exception.js";
import { PostgreSQLException } from "@noldova/context.data.sql.postgresql/exceptions/postgresql.exception.js";
import { UnsafeTransactionException } from "@noldova/context.data.sql.postgresql/exceptions/unsafe-transaction.exception.js";
import { BuiltQuery } from "@noldova/context.data.sql.postgresql/models/built-query.js";
import { Result } from "@noldova/context.data.sql.postgresql/models/result.js";
import { StatementDescription } from "@noldova/context.data.sql.postgresql/models/statement-description.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { BackendMessages as M } from "../../fixtures/backend-messages.fixture.js";
import { FailingQuery } from "../../fixtures/failing-query.fixture.js";
import { PoolHarness } from "../../fixtures/pool-harness.fixture.js";

@TestClass
export class PoolLeaseTests {
  @TestMethod
  public async runsQueriesInOrderOnTheLeasedConnectionAsync(): Promise<void> {
    const harness = new PoolHarness();
    const lease = await harness.pool.acquireLeaseAsync(LeaseKind.Reserve);
    const first = harness.leased(lease, "select 1").execute();
    const second = harness.leased(lease, "select 2").execute();

    Assert.areEqual("P,D,B,E,S,P,D,B,E,S", await harness.writtenAsync(0));
    harness.answer(0, ...PoolHarness.prepared(), ...PoolHarness.prepared());

    Assert.isInstanceOf(await first, Result);
    Assert.isInstanceOf(await second, Result);
    Assert.areEqual(LeaseKind.Reserve, lease.kind);
    Assert.isTrue(lease.options === harness.options);
    Assert.areEqual(1, harness.pool.stats.leased);
    Assert.isFalse(lease.released);
  }

  @TestMethod
  public async refusesQueriesAfterTheReleaseAsync(): Promise<void> {
    const harness = new PoolHarness();
    const lease = await harness.pool.acquireLeaseAsync(LeaseKind.Reserve);

    lease.release();
    lease.release();

    Assert.isTrue(lease.released);
    Assert.areEqual(0, harness.pool.stats.leased);
    Assert.areEqual(1, harness.pool.stats.idle);
    const error = await Assert.throwsAsync(async () => {
      await harness.leased(lease, "select 1");
    }, UnsafeTransactionException);
    Assert.areEqual("The reserve has ended.", error.message);
  }

  @TestMethod
  public async releasesAfterTheRunningQueriesAsync(): Promise<void> {
    const harness = new PoolHarness();
    const lease = await harness.pool.acquireLeaseAsync(LeaseKind.Reserve);
    const first = harness.leased(lease, "select 1").execute();
    const second = harness.leased(lease, "select 2").execute();
    Assert.areEqual("P,D,B,E,S,P,D,B,E,S", await harness.writtenAsync(0));

    lease.release();
    harness.answer(0, ...PoolHarness.prepared());
    await first;
    Assert.isTrue(lease.connection.releasing);
    harness.answer(0, ...PoolHarness.prepared());
    await second;

    Assert.isFalse(lease.connection.releasing);
    Assert.areEqual(1, harness.pool.stats.idle);
    Assert.isNull(harness.socket(0).ended);
  }

  @TestMethod
  public async closesAConnectionReleasedInsideATransactionAsync(): Promise<void> {
    const harness = new PoolHarness();
    const lease = await harness.pool.acquireLeaseAsync(LeaseKind.Transaction);
    const query = harness.leased(lease, "begin").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    harness.answer(0, M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("BEGIN"), M.readyForQuery("T"));
    await query;

    lease.release();

    Assert.isNotNull(harness.socket(0).ended);
    Assert.areEqual(0, harness.pool.stats.connections);
  }

  @TestMethod
  public async closesAReleasedConnectionLeftInsideATransactionAsync(): Promise<void> {
    const harness = new PoolHarness();
    const lease = await harness.pool.acquireLeaseAsync(LeaseKind.Transaction);
    const query = harness.leased(lease, "begin").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));

    lease.release();
    harness.answer(0, M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("BEGIN"), M.readyForQuery("T"));
    await query;

    Assert.isNotNull(harness.socket(0).ended);
    Assert.areEqual(0, harness.pool.stats.connections);
  }

  @TestMethod
  public async runsWaitingWorkWhenTheLeaseIsReleasedAsync(): Promise<void> {
    const harness = new PoolHarness({ max: 1 });
    const lease = await harness.pool.acquireLeaseAsync(LeaseKind.Reserve);
    const query = harness.query("select 1").execute();
    const next = harness.pool.acquireLeaseAsync(LeaseKind.Reserve);
    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.waiting === 2));

    lease.release();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    Assert.areEqual(1, harness.pool.stats.waiting);
    harness.answer(0, ...PoolHarness.prepared());

    Assert.isInstanceOf(await query, Result);
    Assert.isTrue((await next).connection === lease.connection);
    Assert.areEqual(1, harness.starters.length);
  }

  @TestMethod
  public async refusesAQueryThatCannotBeBuiltAsync(): Promise<void> {
    const harness = new PoolHarness();
    const lease = await harness.pool.acquireLeaseAsync(LeaseKind.Reserve);
    const query = new FailingQuery(new BuiltQuery("select 1", [], []), lease);
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, DataException);

    Assert.areEqual("Q", await harness.writtenAsync(0));
    harness.answer(0, M.error("42601", "syntax error"), M.readyForQuery());

    Assert.areEqual("The query cannot be built.", (await rejected).message);
    Assert.isTrue(query.connection === lease.connection);
  }

  @TestMethod
  public async rejectsWorkOnAReleasedLeaseAsync(): Promise<void> {
    const harness = new PoolHarness();
    const lease = await harness.pool.acquireLeaseAsync(LeaseKind.Reserve);
    lease.release();
    const failing = new FailingQuery(new BuiltQuery("select 1", [], []), lease);
    const query = harness.leased(lease, "select 2");

    harness.pool.query(failing, lease);
    harness.pool.query(query, lease);

    Assert.areEqual("The query cannot be built.", (await Assert.throwsAsync(() => failing.promise, DataException)).message);
    Assert.areEqual("The reserve has ended.", (await Assert.throwsAsync(() => query.promise, UnsafeTransactionException)).message);
  }

  @TestMethod
  public async rejectsWorkOnALostConnectionAsync(): Promise<void> {
    const harness = new PoolHarness();
    const lease = await harness.pool.acquireLeaseAsync(LeaseKind.Reserve);
    harness.socket(0).close(null);
    const failing = new FailingQuery(new BuiltQuery("select 1", [], []), lease);
    const query = harness.leased(lease, "select 2");

    harness.pool.query(failing, lease);
    harness.pool.query(query, lease);

    await Assert.throwsAsync(() => failing.promise, DataException);
    const closed = await Assert.throwsAsync(() => query.promise, ConnectionClosedException);
    Assert.isFalse(closed.destroyed);
    Assert.isTrue(lease.error === closed);
    await Assert.throwsAsync(async () => {
      await harness.leased(lease, "select 3");
    }, ConnectionClosedException);
    lease.release();
    Assert.isTrue(lease.released);
  }

  @TestMethod
  public async reportsTheFatalErrorThatClosedTheConnectionAsync(): Promise<void> {
    const harness = new PoolHarness();
    const lease = await harness.pool.acquireLeaseAsync(LeaseKind.Reserve);
    const query = harness.leased(lease, "select 1");
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, PostgreSQLException);
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));

    harness.answer(0, M.error("57P01", "terminating connection due to administrator command", "FATAL"));
    harness.socket(0).close(null);

    Assert.areEqual("57P01", (await rejected).sqlState);
    const lost = await Assert.throwsAsync(() => lease.closed, PostgreSQLException);
    Assert.areEqual("57P01", lost.sqlState);
    Assert.isTrue(lease.error === lost);
  }

  @TestMethod
  public async describesAStatementOnTheLeaseAsync(): Promise<void> {
    const harness = new PoolHarness();
    const lease = await harness.pool.acquireLeaseAsync(LeaseKind.Reserve);
    const query = harness.leased(lease, "select 1").describe().execute();

    Assert.areEqual("P,D,S", await harness.writtenAsync(0));
    harness.answer(0, M.parseComplete(), M.parameterDescription([]), M.noData(), M.readyForQuery());

    const description = await query;
    Assert.isInstanceOf(description, StatementDescription);
    Assert.areEqual(0, description.columns.length);
    Assert.areEqual(0, description.types.length);
  }

  @TestMethod
  public async cancelsAQueryThroughThePoolAsync(): Promise<void> {
    const harness = new PoolHarness();
    const lease = await harness.pool.acquireLeaseAsync(LeaseKind.Reserve);
    const query = harness.leased(lease, "select pg_sleep(5)");
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, PostgreSQLException);
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));

    await query.cancelAsync();
    harness.answer(0, M.error("57014", "canceling statement due to user request"), M.readyForQuery());

    Assert.areEqual(1, harness.starter(0).cancelled.length);
    Assert.areEqual("57014", (await rejected).sqlState);
  }

  @TestMethod
  public async endsAfterTheLeaseIsReleasedAsync(): Promise<void> {
    const harness = new PoolHarness();
    const lease = await harness.pool.acquireLeaseAsync(LeaseKind.Reserve);
    const query = harness.leased(lease, "select 1").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    let ended = false;
    const ending = harness.pool.endAsync().then(() => {
      ended = true;
    });

    harness.answer(0, ...PoolHarness.prepared());
    Assert.isInstanceOf(await query, Result);
    Assert.isFalse(await harness.untilAsync(() => ended));
    Assert.isNull(harness.socket(0).ended);

    lease.release();
    await ending;

    Assert.isNotNull(harness.socket(0).ended);
  }
}
