/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ExchangeKind } from "@noldova/context.data.sql.postgresql/enums/exchange-kind.js";
import { WriteOutcome } from "@noldova/context.data.sql.postgresql/enums/write-outcome.js";
import { Column } from "@noldova/context.data.sql.postgresql/models/column.js";
import { QueryStatement } from "@noldova/context.data.sql.postgresql/models/query-statement.js";
import { Result } from "@noldova/context.data.sql.postgresql/models/result.js";
import { StatementDescription } from "@noldova/context.data.sql.postgresql/models/statement-description.js";
import { Exchange } from "@noldova/context.data.sql.postgresql/models/client/exchange.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ResultTests {
  @TestMethod
  public derivesPlainArrays(): void {
    const result = new Result();
    result.push(1, 2);

    const doubled = result.map(value => Number(value) * 2);

    Assert.isFalse(doubled instanceof Result);
    Assert.isTrue(Array.isArray(doubled));
    Assert.areEqual("2,4", doubled.join(","));
    Assert.isTrue(result instanceof Result);
  }

  @TestMethod
  public describesItsExchangeOnce(): void {
    const result = new Result();
    const exchange = new Exchange(ExchangeKind.Query, null, null, () => WriteOutcome.Written);
    exchange.statement = new QueryStatement("s1", "select $1 as x");
    exchange.params = [23];
    exchange.columns = [new Column("x", null, null, 0, 1, 23)];

    Assert.isNull(result.statement);
    result.statement = exchange;
    const first = result.statement;

    Assert.isNotNull(first);
    Assert.areEqual("s1", first.name);
    Assert.areEqual("select $1 as x", first.text);
    Assert.areEqual("23", first.types.join(","));
    Assert.areEqual("x", first.columns[0]?.name);
    Assert.areEqual(first, result.statement);
  }

  @TestMethod
  public describesAnUnnamedExchangeByItsText(): void {
    const result = new Result();
    const exchange = new Exchange(ExchangeKind.Simple, null, null, () => WriteOutcome.Written);
    exchange.text = "select 1";
    const description = new StatementDescription("s2", "select 2", [], []);

    result.statement = exchange;
    Assert.areEqual("", result.statement?.name);
    Assert.areEqual("select 1", result.statement?.text);
    Assert.areEqual(0, result.statement?.columns.length);
    result.statement = description;

    Assert.areEqual(description, result.statement);
  }
}
