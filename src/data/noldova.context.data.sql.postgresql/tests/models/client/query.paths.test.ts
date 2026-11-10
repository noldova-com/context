/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BuiltQuery } from "@noldova/context.data.sql.postgresql/models/built-query.js";
import { ClientOptions } from "@noldova/context.data.sql.postgresql/models/client-options.js";
import { Query } from "@noldova/context.data.sql.postgresql/models/client/query.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { FakeQueryHandler } from "../../fixtures/fake-query-handler.fixture.js";

@TestClass
export class QueryPathTests {
  @TestMethod
  public async swallowsACancelThatFailsWhenItsSignalAbortsAsync(): Promise<void> {
    const handler = new FakeQueryHandler(new ClientOptions());
    handler.cancelFailure = new RangeError("unreachable");
    const aborted = new AbortController();
    aborted.abort();
    const later = new AbortController();

    new Query(new BuiltQuery("select 1", [], []), handler).useSignal(aborted.signal);
    new Query(new BuiltQuery("select 2", [], []), handler).useSignal(later.signal);
    later.abort();
    await Promise.resolve();
    await Promise.resolve();

    Assert.areEqual(2, handler.cancelled.length);
  }

  @TestMethod
  public async keepsAnErrorThatIsNotATimeoutAfterItTimedOutAsync(): Promise<void> {
    const query = new Query(new BuiltQuery("select 1", [], []), new FakeQueryHandler(new ClientOptions({ queryTimeout: 1 })));
    query.timedOut = true;
    const rejected = Assert.throwsAsync(() => query.promise, RangeError);

    query.useSignal(new AbortController().signal);
    query.fail(new RangeError("other"));

    Assert.areEqual("other", (await rejected).message);
  }
}
