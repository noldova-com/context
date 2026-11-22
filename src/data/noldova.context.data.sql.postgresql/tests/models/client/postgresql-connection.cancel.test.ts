/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import type { Buffer } from "node:buffer";

import { LeaseKind } from "@noldova/context.data.sql.postgresql/enums/lease-kind.js";
import { PostgreSQLException } from "@noldova/context.data.sql.postgresql/exceptions/postgresql.exception.js";
import { StrayCancelException } from "@noldova/context.data.sql.postgresql/exceptions/stray-cancel.exception.js";
import { QueryStatement } from "@noldova/context.data.sql.postgresql/models/query-statement.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { BackendMessages as M } from "../../fixtures/backend-messages.fixture.js";
import { ConnectionHarness } from "../../fixtures/connection-harness.fixture.js";
import { FakeLease } from "../../fixtures/fake-lease.fixture.js";

@TestClass
export class PostgreSQLConnectionCancelTests {
  private static readonly ENDED: readonly Buffer[] = [
    M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery(),
  ];

  private static readonly STOPPED: readonly Buffer[] = [
    M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.error("57014", "canceling statement due to user request"), M.readyForQuery(),
  ];

  @TestMethod
  public async retriesAQueryThatAnEarlierQuerysCancelStoppedWhileThatCancelWasInFlightAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const held = Promise.withResolvers<void>();
    harness.starter.holding = held.promise;
    const timed = harness.unnamed("select pg_sleep(1)");
    const behind = harness.unnamed("select 2");
    harness.connection.send(timed);
    harness.connection.send(behind);
    harness.written();

    const cancelling = harness.connection.cancelAsync(timed);
    harness.receive(...PostgreSQLConnectionCancelTests.ENDED, ...PostgreSQLConnectionCancelTests.STOPPED);
    const retried = harness.written();
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData());
    const run = harness.written();
    harness.receive(M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery());
    held.resolve();
    await cancelling;

    await timed;
    Assert.areEqual("[]", JSON.stringify(await behind));
    Assert.areEqual("P,D,H", retried);
    Assert.areEqual("B,E,S", run);
    Assert.areEqual(1, harness.starter.cancelled.length);
  }

  @TestMethod
  public async failsAQueryThatAnEarlierQuerysCancelStoppedWhenItCannotBeRetriedAsync(): Promise<void> {
    const harness = new ConnectionHarness({ max: 1 });
    const timed = harness.unnamed("select pg_sleep(1)");
    const behind = harness.unnamed("select 2");
    const last = harness.unnamed("select 3");
    harness.connection.send(timed);
    harness.connection.send(behind);
    harness.connection.send(last);
    harness.written();
    const refused = Assert.throwsAsync(async () => {
      await behind;
    }, StrayCancelException);

    await harness.connection.cancelAsync(timed);
    harness.receive(...PostgreSQLConnectionCancelTests.ENDED, ...PostgreSQLConnectionCancelTests.STOPPED, ...PostgreSQLConnectionCancelTests.ENDED);
    const error = await refused;
    await timed;
    await last;

    const cause = error.cause;
    Assert.isInstanceOf(cause, PostgreSQLException);
    Assert.areEqual("57014", cause.sqlState);
    Assert.areEqual(String.empty, harness.written());
  }

  @TestMethod
  public async failsAQueryWhoseOwnCancelWasWaitingAsCanceledAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const timed = harness.unnamed("select pg_sleep(1)");
    const behind = harness.unnamed("select 2");
    harness.connection.send(timed);
    harness.connection.send(behind);
    harness.written();
    const refused = Assert.throwsAsync(async () => {
      await behind;
    }, PostgreSQLException);

    await harness.connection.cancelAsync(timed);
    const ownCancel = harness.connection.cancelAsync(behind);
    harness.receive(...PostgreSQLConnectionCancelTests.ENDED, ...PostgreSQLConnectionCancelTests.STOPPED);
    const written = harness.written();
    await ownCancel;
    await timed;

    Assert.areEqual("57014", (await refused).sqlState);
    Assert.areEqual(String.empty, written);
    Assert.areEqual(1, harness.starter.cancelled.length);
  }

  @TestMethod
  public async keepsACancelInFlightPastTheConnectionsIdleTimeAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const held = Promise.withResolvers<void>();
    harness.starter.holding = held.promise;
    const timed = harness.unnamed("select pg_sleep(1)");
    harness.connection.send(timed);
    harness.written();
    const cancelling = harness.connection.cancelAsync(timed);
    harness.receive(...PostgreSQLConnectionCancelTests.ENDED);
    await timed;

    const later = harness.unnamed("select 2");
    harness.connection.send(later);
    harness.written();
    harness.receive(...PostgreSQLConnectionCancelTests.STOPPED);
    const retried = harness.written();
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData());
    harness.written();
    harness.receive(M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery());
    held.resolve();
    await cancelling;

    Assert.areEqual("[]", JSON.stringify(await later));
    Assert.areEqual("P,D,H", retried);
  }

  @TestMethod
  public async forgetsASettledCancelOnceTheConnectionIsIdleAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const timed = harness.unnamed("select pg_sleep(1)");
    harness.connection.send(timed);
    harness.written();
    await harness.connection.cancelAsync(timed);
    harness.receive(...PostgreSQLConnectionCancelTests.ENDED);
    await timed;

    const later = harness.unnamed("select 2");
    harness.connection.send(later);
    harness.written();
    const refused = Assert.throwsAsync(async () => {
      await later;
    }, PostgreSQLException);
    harness.receive(...PostgreSQLConnectionCancelTests.STOPPED);

    Assert.areEqual("57014", (await refused).sqlState);
    Assert.areEqual(String.empty, harness.written());
  }

  @TestMethod
  public async forgetsACancelThatSettlesWhileNothingIsSentAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const held = Promise.withResolvers<void>();
    harness.starter.holding = held.promise;
    const timed = harness.unnamed("select pg_sleep(1)");
    harness.connection.send(timed);
    harness.written();
    const cancelling = harness.connection.cancelAsync(timed);
    harness.receive(...PostgreSQLConnectionCancelTests.ENDED);
    await timed;
    held.resolve();
    await cancelling;

    const later = harness.unnamed("select 2");
    harness.connection.send(later);
    harness.written();
    const refused = Assert.throwsAsync(async () => {
      await later;
    }, PostgreSQLException);
    harness.receive(...PostgreSQLConnectionCancelTests.STOPPED);

    Assert.areEqual("57014", (await refused).sqlState);
    Assert.areEqual(String.empty, harness.written());
  }

  @TestMethod
  public async forgetsASettledCancelOnABusyConnectionOnceTheQueriesSentBeforeItEndAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const timed = harness.unnamed("select pg_sleep(1)");
    harness.connection.send(timed);
    harness.written();
    await harness.connection.cancelAsync(timed);
    const later = harness.unnamed("select 2");
    const last = harness.unnamed("select 3");
    harness.connection.send(later);
    harness.connection.send(last);
    harness.written();
    const refused = Assert.throwsAsync(async () => {
      await later;
    }, PostgreSQLException);

    harness.receive(...PostgreSQLConnectionCancelTests.ENDED, ...PostgreSQLConnectionCancelTests.STOPPED, ...PostgreSQLConnectionCancelTests.ENDED);
    await timed;
    await last;

    Assert.areEqual("57014", (await refused).sqlState);
    Assert.areEqual(String.empty, harness.written());
  }

  @TestMethod
  public async dropsTheStatementAStrayCancelStoppedWhileItWasParsedAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    harness.connection.lease = new FakeLease(LeaseKind.Transaction);
    const begin = harness.plain("begin");
    harness.connection.sendSimple(begin, "begin");
    harness.written();
    harness.receive(M.commandComplete("BEGIN"), M.readyForQuery("T"));
    await begin;
    const statement = new QueryStatement("s1", "select 1 as x");
    const timed = harness.unnamed("select pg_sleep(1)");
    const named = harness.query(statement, [], []);
    harness.connection.send(timed);
    harness.connection.send(named);
    harness.written();
    const refused = Assert.throwsAsync(async () => {
      await named;
    }, StrayCancelException);

    await harness.connection.cancelAsync(timed);
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.noData(), M.bindComplete(), M.commandComplete("SELECT 0"), M.readyForQuery("T"),
      M.error("57014", "canceling statement due to user request"), M.readyForQuery("E"));
    await refused;
    await timed;
    const again = harness.query(statement, [], []);
    harness.connection.send(again);
    const written = harness.written();
    harness.receive(M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 23]]), M.bindComplete(), M.dataRow(["1"]),
      M.commandComplete("SELECT 1"), M.readyForQuery("E"));

    Assert.isTrue(written.startsWith("P,"), written);
    Assert.areEqual("[{\"x\":1}]", JSON.stringify(await again));
  }

  @TestMethod
  public async usesUpACancelOnTheQueryItStoppedAsync(): Promise<void> {
    const harness = new ConnectionHarness();
    const timed = harness.unnamed("select pg_sleep(1)");
    const behind = harness.unnamed("select 2");
    harness.connection.send(timed);
    harness.connection.send(behind);
    harness.written();
    const stopped = Assert.throwsAsync(async () => {
      await timed;
    }, PostgreSQLException);
    const refused = Assert.throwsAsync(async () => {
      await behind;
    }, PostgreSQLException);

    await harness.connection.cancelAsync(timed);
    harness.receive(...PostgreSQLConnectionCancelTests.STOPPED, ...PostgreSQLConnectionCancelTests.STOPPED);

    Assert.areEqual("57014", (await stopped).sqlState);
    Assert.areEqual("57014", (await refused).sqlState);
    Assert.areEqual(String.empty, harness.written());
  }
}
