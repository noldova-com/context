/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException } from "@noldova/context.data";
import { RowMode } from "@noldova/context.data.sql.postgresql/enums/row-mode.js";
import { CancelUnansweredException } from "@noldova/context.data.sql.postgresql/exceptions/cancel-unanswered.exception.js";
import { ConnectionClosedException } from "@noldova/context.data.sql.postgresql/exceptions/connection-closed.exception.js";
import { PostgreSQLException } from "@noldova/context.data.sql.postgresql/exceptions/postgresql.exception.js";
import { QueryCanceledException } from "@noldova/context.data.sql.postgresql/exceptions/query-canceled.exception.js";
import { QueryTimeoutException } from "@noldova/context.data.sql.postgresql/exceptions/query-timeout.exception.js";
import { BuiltQuery } from "@noldova/context.data.sql.postgresql/models/built-query.js";
import { ClientOptions } from "@noldova/context.data.sql.postgresql/models/client-options.js";
import { Result } from "@noldova/context.data.sql.postgresql/models/result.js";
import { Query } from "@noldova/context.data.sql.postgresql/models/client/query.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { FakeQueryHandler } from "../../fixtures/fake-query-handler.fixture.js";
import { FakeTimers } from "../../fixtures/fake-timers.fixture.js";

@TestClass
export class QueryTests {
  @TestMethod
  public async handsItselfToTheHandlerOnceAsync(): Promise<void> {
    const handler = new FakeQueryHandler(new ClientOptions());
    const query = new Query(new BuiltQuery("select $1", [1], [23]), handler);
    handler.onHandle = item => item.complete(null);

    Assert.areEqual("select $1", query.text);
    Assert.areEqual(1, query.parameters[0]);
    Assert.isNull(query.statement);
    query.execute();
    Assert.isNull(await query);
    await query.finally(() => undefined);
    await query.catch(() => undefined);

    Assert.areEqual(1, handler.handled.length);
    Assert.isTrue(query.settled);
  }

  @TestMethod
  public async mapsACancelAfterATimeoutToATimeoutAsync(): Promise<void> {
    const timers = new FakeTimers();
    const handler = new FakeQueryHandler(new ClientOptions({ queryTimeout: 3, timers }));
    const canceled = new Query(new BuiltQuery("select 1", [], []), handler);
    const fatal = new Query(new BuiltQuery("select 2", [], []), handler);
    const closed = new Query(new BuiltQuery("select 3", [], []), handler);
    const other = new Query(new BuiltQuery("select 4", [], []), handler);
    const unanswered = new CancelUnansweredException(5, false);
    for (const query of [canceled, fatal, closed, other]) {
      query.timedOut = true;
      query.timer = timers.setTimeout(() => undefined, 3000);
    }

    canceled.fail(new QueryCanceledException());
    fatal.fail(new PostgreSQLException(new Map([["code", "57014"], ["message", "canceling statement"]])));
    closed.fail(new ConnectionClosedException(true, "localhost", 5432, unanswered));
    other.fail(new DataException("other"));

    Assert.areEqual(3, (await Assert.throwsAsync(() => canceled.promise, QueryTimeoutException)).seconds);
    await Assert.throwsAsync(() => fatal.promise, QueryTimeoutException);
    Assert.areEqual(unanswered, (await Assert.throwsAsync(() => closed.promise, QueryTimeoutException)).cause);
    await Assert.throwsAsync(() => other.promise, DataException);
    Assert.isNull(canceled.timer);
    Assert.areEqual(0, timers.scheduled);
  }

  @TestMethod
  public async keepsAClosedErrorThatIsNotATimeoutAsync(): Promise<void> {
    const handler = new FakeQueryHandler(new ClientOptions());
    const query = new Query(new BuiltQuery("select 1", [], []), handler);
    query.timedOut = true;

    query.fail(new ConnectionClosedException(false, "localhost", 5432, null));

    await Assert.throwsAsync(() => query.promise, ConnectionClosedException);
  }

  @TestMethod
  public async redirectsItsSettlementAsync(): Promise<void> {
    const handler = new FakeQueryHandler(new ClientOptions());
    const query = new Query(new BuiltQuery("select 1", [], []), handler);
    const seen: string[] = [];

    query.redirect(() => seen.push("resolved"), error => seen.push(error.message));
    query.resolve(null);
    query.reject(new DataException("failed"));

    Assert.areEqual("resolved,failed", seen.join(","));
    Assert.isFalse(query.settled);
    query.redirect(() => undefined, () => undefined);
    await Promise.resolve();
  }

  @TestMethod
  public async cancelsThroughItsOwnerAsync(): Promise<void> {
    const handler = new FakeQueryHandler(new ClientOptions());
    const owner = new Query(new BuiltQuery("select 1", [], []), handler);
    const part = new Query(new BuiltQuery("select 2", [], []), handler);
    part.owner = owner;

    await part.cancelAsync();

    Assert.areEqual(owner, handler.cancelled[0]);
  }

  @TestMethod
  public async cancelsWhenItsSignalAbortsAsync(): Promise<void> {
    const handler = new FakeQueryHandler(new ClientOptions());
    const controller = new AbortController();
    const query = new Query(new BuiltQuery("select 1", [], []), handler).useSignal(controller.signal).useSignal(null);
    const aborted = new AbortController();
    aborted.abort();
    const early = new Query(new BuiltQuery("select 2", [], []), handler).useSignal(aborted.signal);

    controller.abort();
    controller.abort();
    await Promise.resolve();

    Assert.areEqual(early, handler.cancelled[0]);
    Assert.areEqual(query, handler.cancelled[1]);
    Assert.areEqual(2, handler.cancelled.length);
  }

  @TestMethod
  public async stopsListeningOnceSettledAsync(): Promise<void> {
    const handler = new FakeQueryHandler(new ClientOptions());
    const controller = new AbortController();
    const query = new Query(new BuiltQuery("select 1", [], []), handler).useSignal(controller.signal);

    query.complete(null);
    controller.abort();
    query.useSignal(controller.signal);
    await query;

    Assert.areEqual(0, handler.cancelled.length);
  }

  @TestMethod
  public setsItsModes(): void {
    const handler = new FakeQueryHandler(new ClientOptions());
    const parsers = new Map([[23, null]]);
    const query = new Query(new BuiltQuery("select 1", [], []), handler);

    Assert.areEqual(RowMode.Raw, query.useRawRows().rowMode);
    Assert.areEqual(RowMode.Values, query.useValueRows().rowMode);
    Assert.areEqual(parsers, query.useParsers(parsers).ownParsers);
    Assert.isTrue(query.useSimpleProtocol().options.simple);
    Assert.isFalse(query.options.prepare === true);
    Assert.isTrue(query.describe().onlyDescribe);
    Assert.isFalse(query.options.simple);
    Assert.isTrue(query.options.prepare === true);
    Assert.areEqual(3, query.useCursor(3, () => undefined).cursorRows);
  }

  @TestMethod
  public callsItsCursorCallbackOnlyWhenItHasOne(): void {
    const handler = new FakeQueryHandler(new ClientOptions());
    const rows = new Result();
    const plain = new Query(new BuiltQuery("select 1", [], []), handler);
    const seen: Result[] = [];
    const cursor = new Query(new BuiltQuery("select 1", [], []), handler).useCursor(1, result => {
      seen.push(result);
      return "next";
    });

    Assert.isUndefined(plain.callCursor(rows));
    Assert.areEqual("next", cursor.callCursor(rows));
    Assert.areEqual(1, seen.length);
    Assert.isTrue(seen[0] === rows);
  }

  @TestMethod
  public async callsItsRowCallbackAsync(): Promise<void> {
    const handler = new FakeQueryHandler(new ClientOptions());
    const rows: unknown[] = [];
    handler.onHandle = item => {
      item.forEachFn?.(1, new Result());
      item.complete(null);
    };

    await new Query(new BuiltQuery("select 1", [], []), handler).forEach(row => rows.push(row));

    Assert.areEqual("1", rows.join(","));
  }

  @TestMethod
  public async streamsAsASimpleQueryAsync(): Promise<void> {
    const handler = new FakeQueryHandler(new ClientOptions());
    handler.onHandle = item => item.complete(null);
    const readable = new Query(new BuiltQuery("copy t to stdout", [], []), handler);
    const writable = new Query(new BuiltQuery("copy t from stdin", [], []), handler);

    Assert.isNull(await readable.openReadableAsync());
    Assert.isNull(await writable.openWritableAsync());

    Assert.isTrue(readable.streaming && readable.options.simple);
    Assert.isTrue(writable.streaming && writable.options.simple);
  }

  @TestMethod
  public async iteratesACursorAsync(): Promise<void> {
    const handler = new FakeQueryHandler(new ClientOptions());
    const query = new Query(new BuiltQuery("select x from t", [], []), handler);
    const steps: unknown[] = [];
    handler.onHandle = item => {
      item.active = true;
      const first = new Result();
      first.push(1);
      const second = new Result();
      second.push(2);
      Promise.resolve(item.cursorFn?.(first))
        .then(action => {
          steps.push(action);
          return item.cursorFn?.(second);
        })
        .then(action => {
          steps.push(action);
          item.resolve(null);
        })
        .catch(() => undefined);
    };

    const seen: unknown[] = [];
    for await (const rows of query.iterateCursor(2))
      seen.push(rows[0]);

    Assert.areEqual("1,2", seen.join(","));
    Assert.areEqual("next,next", steps.join(","));
    Assert.areEqual(2, query.cursorRows);
    Assert.isTrue((await query.iterateCursor()[Symbol.asyncIterator]().next()).done === true);
  }

  @TestMethod
  public async closesACursorEarlyAsync(): Promise<void> {
    const handler = new FakeQueryHandler(new ClientOptions());
    const query = new Query(new BuiltQuery("select x from t", [], []), handler);
    const steps: unknown[] = [];
    handler.onHandle = item => {
      item.active = true;
      Promise.resolve(item.cursorFn?.(new Result()))
        .then(action => {
          steps.push(action);
          item.resolve(null);
        })
        .catch(() => undefined);
    };

    for await (const rows of query.iterateCursor()) {
      Assert.areEqual(0, rows.length);
      break;
    }
    await Promise.resolve();
    await Promise.resolve();

    Assert.areEqual("close", steps.join(","));
  }

  @TestMethod
  public async rejectsACursorThatFailsAsync(): Promise<void> {
    const handler = new FakeQueryHandler(new ClientOptions());
    const query = new Query(new BuiltQuery("select x from t", [], []), handler);
    handler.onHandle = item => item.reject(new DataException("failed"));
    const iterator = query.iterateCursor()[Symbol.asyncIterator]();

    await Assert.throwsAsync(() => iterator.next(), DataException);

    Assert.isTrue(query.settled);
  }
}
