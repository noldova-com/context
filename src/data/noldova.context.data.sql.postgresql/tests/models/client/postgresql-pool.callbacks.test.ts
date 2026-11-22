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
import { CallbacksFailedException } from "@noldova/context.data.sql.postgresql/exceptions/callbacks-failed.exception.js";
import { ConnectionClosedException } from "@noldova/context.data.sql.postgresql/exceptions/connection-closed.exception.js";
import { Result } from "@noldova/context.data.sql.postgresql/models/result.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { BackendMessages as M } from "../../fixtures/backend-messages.fixture.js";
import { PoolHarness } from "../../fixtures/pool-harness.fixture.js";

@TestClass
export class PostgreSQLPoolCallbackTests {
  @TestMethod
  public async rejectsTheJobAConnectionOpenedForWhenAStartupParameterHandlerThrowsAsync(): Promise<void> {
    const failure = new DataException("parameter");
    const harness = new PoolHarness({
      onparameter: () => {
        throw failure;
      }
    });

    const error = await Assert.throwsAsync(async () => {
      await harness.query("select 1").execute();
    }, DataException);

    Assert.isTrue(error === failure);
    Assert.isTrue(harness.socket(0).destroyed);
    Assert.areEqual(0, harness.pool.stats.connections);
  }

  @TestMethod
  public async rejectsTheJobAndClosesTheConnectionWhenMaxLifetimeThrowsAsync(): Promise<void> {
    const failure = new DataException("lifetime");
    const harness = new PoolHarness({
      maxLifetime: () => {
        throw failure;
      }
    });

    const error = await Assert.throwsAsync(async () => {
      await harness.query("select 1").execute();
    }, DataException);

    Assert.isTrue(error === failure);
    Assert.isTrue(harness.socket(0).destroyed);
    Assert.areEqual(0, harness.pool.stats.connections);
  }

  @TestMethod
  public async rejectsTheWaitingJobsWhenTheConnectBackoffThrowsAsync(): Promise<void> {
    const failure = new DataException("backoff");
    const harness = new PoolHarness({
      backoff: () => {
        throw failure;
      }
    });
    harness.automatic = false;
    const query = harness.query("select 1").execute();
    Assert.isTrue(await harness.untilAsync(() => harness.starters.length === 1));

    harness.starter(0).fail(new DataException("The server refused the connection."));
    const error = await Assert.throwsAsync(async () => {
      await query;
    }, DataException);

    Assert.isTrue(error === failure);
    Assert.areEqual(0, harness.pool.stats.waiting);
  }

  @TestMethod
  public async rejectsTheQueriesWaitingOnTypesWhenTheTypesBackoffThrowsAsync(): Promise<void> {
    const failure = new DataException("backoff");
    const harness = new PoolHarness({
      fetchTypes: true,
      backoff: () => {
        throw failure;
      }
    });
    const query = harness.query("select x");
    const rejected = Assert.throwsAsync(async () => {
      await query;
    }, ConnectionClosedException);
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    harness.automatic = false;

    harness.answer(0, M.parseComplete(), M.parameterDescription([]), M.rowDescription([["x", 16400]]));
    Assert.isTrue(await harness.untilAsync(() => harness.starters.length === 2));
    harness.starter(1).fail(new DataException("The server refused the connection."));

    Assert.isTrue((await rejected).cause === failure);
    Assert.isTrue(harness.socket(0).destroyed);
    Assert.areEqual(0, harness.timers.scheduled);
  }

  @TestMethod
  public async replacesAConnectionWhoseParameterHandlerThrowsBetweenQueriesAsync(): Promise<void> {
    const harness = new PoolHarness({
      onparameter: name => {
        if (name === "TimeZone")
          throw new DataException("parameter");
      }
    });
    Assert.isInstanceOf(await PostgreSQLPoolCallbackTests.runAsync(harness, 0), Result);

    harness.answer(0, M.parameterStatus("TimeZone", "UTC"));

    Assert.isTrue(harness.socket(0).destroyed);
    Assert.areEqual(0, harness.pool.stats.connections);
    Assert.isInstanceOf(await PostgreSQLPoolCallbackTests.runAsync(harness, 1), Result);
  }

  @TestMethod
  public async rejectsTheEndWhenTheCloseHandlerThrowsAsync(): Promise<void> {
    const failure = new DataException("close");
    const harness = PostgreSQLPoolCallbackTests.closing(failure);
    await PostgreSQLPoolCallbackTests.runAsync(harness, 0);

    const error = await Assert.throwsAsync(() => harness.pool.endAsync(), DataException);

    Assert.isTrue(error === failure);
    Assert.areEqual(0, harness.pool.stats.connections);
  }

  @TestMethod
  public async rejectsTheCloseWhenTheCloseHandlerThrowsAsync(): Promise<void> {
    const failure = new DataException("close");
    const harness = PostgreSQLPoolCallbackTests.closing(failure);
    const lease = await harness.pool.acquireLeaseAsync(LeaseKind.Reserve);
    const closing = harness.pool.closeAsync();

    lease.release();
    const error = await Assert.throwsAsync(() => closing, DataException);

    Assert.isTrue(error === failure);
    Assert.isTrue(harness.socket(0).destroyed || !Object.isNull(harness.socket(0).ended));
    Assert.areEqual(0, harness.pool.stats.connections);
  }

  @TestMethod
  public async rejectsTheLeaseWhenTheCloseHandlerThrowsAsync(): Promise<void> {
    const failure = new DataException("close");
    const harness = PostgreSQLPoolCallbackTests.closing(failure);
    const lease = await harness.pool.acquireLeaseAsync(LeaseKind.Reserve);

    harness.socket(0).close(null);
    const error = await Assert.throwsAsync(() => lease.closed, DataException);

    Assert.isTrue(error === failure);
    Assert.isInstanceOf(await PostgreSQLPoolCallbackTests.runAsync(harness, 1), Result);
  }

  @TestMethod
  public async rejectsTheNextJobOnceWhenTheCloseHandlerThrowsForAnIdleConnectionAsync(): Promise<void> {
    const failure = new DataException("close");
    const harness = PostgreSQLPoolCallbackTests.closing(failure);
    await PostgreSQLPoolCallbackTests.runAsync(harness, 0);

    harness.socket(0).close(null);
    const error = await Assert.throwsAsync(async () => {
      await harness.query("select 1").execute();
    }, DataException);

    Assert.isTrue(error === failure);
    Assert.isInstanceOf(await PostgreSQLPoolCallbackTests.runAsync(harness, 1), Result);
  }

  @TestMethod
  public async rejectsTheEndWithTheCloseHandlerErrorOfAnIdleConnectionAsync(): Promise<void> {
    const failure = new DataException("close");
    const harness = PostgreSQLPoolCallbackTests.closing(failure);
    await PostgreSQLPoolCallbackTests.runAsync(harness, 0);

    harness.socket(0).close(null);
    const error = await Assert.throwsAsync(() => harness.pool.endAsync(), DataException);

    Assert.isTrue(error === failure);
    Assert.areEqual(0, harness.pool.stats.connections);
  }

  @TestMethod
  public async rejectsTheNextJobWithEveryKeptErrorInOrderAsync(): Promise<void> {
    const failures = [new DataException("first"), new DataException("second")];
    let closes = 0;
    const harness = new PoolHarness({
      min: 2,
      max: 2,
      onclose: () => {
        closes += 1;
        if (closes <= failures.length)
          throw failures[closes - 1];
      }
    });
    const warm = harness.query("select 1").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    Assert.isTrue(await harness.untilAsync(() => harness.pool.stats.connections === 2));
    harness.answer(0, ...PoolHarness.prepared());
    await warm;

    harness.socket(0).close(null);
    harness.socket(1).close(null);
    const error = await Assert.throwsAsync(async () => {
      await harness.query("select 1").execute();
    }, CallbacksFailedException);

    Assert.areEqual("More than one of the client's callbacks threw; errors holds each error, in order.", error.message);
    Assert.areEqual(2, error.errors.length);
    Assert.isTrue(error.errors[0] === failures[0]);
    Assert.isTrue(error.errors[1] === failures[1]);
    await harness.pool.endAsync();
  }

  @TestMethod
  public async rejectsTheNextJobWhenMaxLifetimeThrowsForAConnectionNoJobWaitedForAsync(): Promise<void> {
    const failure = new DataException("lifetime");
    let opened = 0;
    const harness = new PoolHarness({
      min: 2,
      max: 2,
      maxLifetime: () => {
        opened += 1;
        if (opened === 2)
          throw failure;
        return 3600;
      }
    });
    const warm = harness.query("select 1").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(0));
    Assert.isTrue(await harness.untilAsync(() => harness.starters.length >= 2 && harness.socket(1).destroyed));
    harness.answer(0, ...PoolHarness.prepared());
    await warm;

    const error = await Assert.throwsAsync(async () => {
      await harness.query("select 1").execute();
    }, DataException);

    Assert.isTrue(error === failure);
  }

  private static closing(failure: Error): PoolHarness {
    return new PoolHarness({
      onclose: () => {
        throw failure;
      }
    });
  }

  private static async runAsync(harness: PoolHarness, index: number): Promise<unknown> {
    const query = harness.query("select 1").execute();
    Assert.areEqual("P,D,B,E,S", await harness.writtenAsync(index));
    harness.answer(index, ...PoolHarness.prepared());
    return await query;
  }
}
