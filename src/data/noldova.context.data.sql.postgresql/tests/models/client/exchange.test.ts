/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ExchangeKind } from "@noldova/context.data.sql.postgresql/enums/exchange-kind.js";
import { WriteOutcome } from "@noldova/context.data.sql.postgresql/enums/write-outcome.js";
import { BuiltQuery } from "@noldova/context.data.sql.postgresql/models/built-query.js";
import { ClientOptions } from "@noldova/context.data.sql.postgresql/models/client-options.js";
import { PreparedStatement } from "@noldova/context.data.sql.postgresql/models/prepared-statement.js";
import { Exchange } from "@noldova/context.data.sql.postgresql/models/client/exchange.js";
import { Query } from "@noldova/context.data.sql.postgresql/models/client/query.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { FakeQueryHandler } from "../../fixtures/fake-query-handler.fixture.js";

@TestClass
export class ExchangeTests {
  @TestMethod
  public holdsTheConnectionOnlyWhileItsWorkIsOpen(): void {
    Assert.isFalse(ExchangeTests.exchange().isHolding());
    Assert.isTrue(ExchangeTests.exchange(t => { t.describing = true; }).isHolding());
    Assert.isFalse(ExchangeTests.exchange(t => { t.gate = true; }).isHolding());
    Assert.isTrue(ExchangeTests.exchange(t => { t.gate = true; t.learn = true; }).isHolding());
    Assert.isTrue(ExchangeTests.exchange(t => { t.gate = true; t.learn = true; t.error = new Error("x"); }).isHolding());
    Assert.isFalse(ExchangeTests.exchange(t => { t.error = new Error("x"); t.done = true; }).isHolding());
    Assert.isTrue(ExchangeTests.exchange(t => { t.flushing = true; }).isHolding());
    Assert.isFalse(ExchangeTests.exchange(t => { t.flushing = true; t.synced = true; }).isHolding());
    Assert.isTrue(ExchangeTests.exchange(t => { t.streaming = true; t.open = true; }).isHolding());
    Assert.isFalse(ExchangeTests.exchange(t => { t.streaming = true; }).isHolding());
    Assert.isTrue(ExchangeTests.alone().isHolding());
    Assert.isFalse(ExchangeTests.alone(t => { t.done = true; }).isHolding());
  }

  @TestMethod
  public isExclusiveWhileFlushingStreamingOrAlone(): void {
    Assert.isFalse(ExchangeTests.exchange().exclusive);
    Assert.isTrue(ExchangeTests.exchange(t => { t.flushing = true; }).exclusive);
    Assert.isTrue(ExchangeTests.exchange(t => { t.streaming = true; }).exclusive);
    Assert.isTrue(ExchangeTests.alone().exclusive);
    Assert.isTrue(ExchangeTests.alone().alone);
    Assert.isFalse(ExchangeTests.exchange().alone);
  }

  @TestMethod
  public isNotableOnlyAtOrAboveTheThreshold(): void {
    Assert.isFalse(ExchangeTests.exchange().isNotable(0));
    Assert.isTrue(ExchangeTests.exchange(t => { t.cost = 5; }).isNotable(5));
    Assert.isFalse(ExchangeTests.exchange(t => { t.cost = 4; }).isNotable(5));
  }

  @TestMethod
  public describesItsTypesFromTheParametersOrThePreparedStatement(): void {
    const prepared = ExchangeTests.exchange(t => { t.entry = new PreparedStatement("s1", t, [23, 25]); });
    const unknown = ExchangeTests.exchange(t => { t.entry = new PreparedStatement("s2", t, null); });
    const given = ExchangeTests.exchange(t => {
      t.params = [16];
      t.entry = new PreparedStatement("s3", t, [23]);
    });

    Assert.areEqual("23,25", prepared.describe().types.join(","));
    Assert.areEqual(0, unknown.describe().types.length);
    Assert.areEqual("16", given.describe().types.join(","));
    Assert.areEqual(0, ExchangeTests.exchange().describe().types.length);
  }

  private static exchange(set: (exchange: Exchange) => void = () => undefined): Exchange {
    const exchange = new Exchange(ExchangeKind.Query, null, null, () => WriteOutcome.Written);
    set(exchange);
    return exchange;
  }

  private static alone(set: (exchange: Exchange) => void = () => undefined): Exchange {
    const query = new Query(new BuiltQuery("begin", [], []), new FakeQueryHandler(new ClientOptions()));
    query.alone = true;
    const exchange = new Exchange(ExchangeKind.Query, query, null, () => WriteOutcome.Written);
    set(exchange);
    return exchange;
  }
}
