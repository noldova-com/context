/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BuiltQuery } from "@noldova/context.data.sql.postgresql/models/built-query.js";
import { QueryCost } from "@noldova/context.data.sql.postgresql/models/query-cost.js";
import { StatementCache } from "@noldova/context.data.sql.postgresql/models/client/statement-cache.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class StatementCacheTests {
  @TestMethod
  public givesUnnamedStatementsTheTextCost(): void {
    const scheduled = new StatementCache(true);
    const plain = new StatementCache(false);

    const statement = scheduled.get(new BuiltQuery("select 1", [], []), false);

    Assert.areEqual("", statement.name);
    Assert.isFalse(statement.live);
    Assert.isTrue(statement.cost === scheduled.readCost("select 1"));
    Assert.isNull(plain.get(new BuiltQuery("select 1", [], []), false).cost);
  }

  @TestMethod
  public reusesAPreparedStatementByTypesAndText(): void {
    const cache = new StatementCache(true);

    const first = cache.get(new BuiltQuery("select $1", [1], [23]), true);
    const again = cache.get(new BuiltQuery("select $1", [2], [23]), true);
    const other = cache.get(new BuiltQuery("select $1", [2], [25]), true);

    Assert.isTrue(first === again);
    Assert.isFalse(first === other);
    Assert.isTrue(first.live);
    Assert.isTrue(first.name.length > 0);
    Assert.areNotEqual(first.name, other.name);
    Assert.areEqual(1, again.used);
    Assert.areEqual(2, other.used);
    Assert.isNotNull(first.cost);
  }

  @TestMethod
  public evictsTheLeastRecentlyUsedStatement(): void {
    const cache = new StatementCache(false);
    const first = cache.get(new BuiltQuery("select 0", [], []), true);
    const second = cache.get(new BuiltQuery("select 1", [], []), true);
    for (let index = 2; index < 2000; index += 1)
      cache.get(new BuiltQuery("select " + String(index), [], []), true);
    cache.get(new BuiltQuery("select 0", [], []), true);

    cache.get(new BuiltQuery("select 2000", [], []), true);

    Assert.isTrue(first.live);
    Assert.isFalse(second.live);
    Assert.isFalse(cache.get(new BuiltQuery("select 1", [], []), true) === second);
  }

  @TestMethod
  public forgetsTheOldestTextCost(): void {
    const cache = new StatementCache(true);
    const first = cache.readCost("select 0");
    for (let index = 1; index <= 2000; index += 1)
      cache.readCost("select " + String(index));

    Assert.isFalse(cache.readCost("select 0") === first);
    Assert.isTrue(cache.readCost("select 2000") === cache.readCost("select 2000"));
  }

  @TestMethod
  public clearsEveryStatement(): void {
    const cache = new StatementCache(true);
    const statement = cache.get(new BuiltQuery("select 1", [], []), true);

    cache.clear();

    Assert.isFalse(statement.live);
    Assert.isFalse(cache.get(new BuiltQuery("select 1", [], []), true) === statement);
  }

  @TestMethod
  public remembersWhetherATextOpensATransaction(): void {
    const cost = new QueryCost();

    Assert.isTrue(StatementCache.isAlone(cost, "begin"));
    Assert.isTrue(cost.alone === true);
    Assert.isTrue(StatementCache.isAlone(cost, "select 1"));
  }

  @TestMethod
  public findsTheStatementsThatOpenATransaction(): void {
    Assert.isTrue(StatementCache.isOpening("BEGIN"));
    Assert.isTrue(StatementCache.isOpening("begin isolation level serializable"));
    Assert.isTrue(StatementCache.isOpening("start transaction"));
    Assert.isTrue(StatementCache.isOpening("START /* a */ /* b */ TRANSACTION read only"));
    Assert.isTrue(StatementCache.isOpening("select 1; start x; start transaction"));
    Assert.isFalse(StatementCache.isOpening("start /* unterminated"));
    Assert.isFalse(StatementCache.isOpening("start /* start transaction */"));
    Assert.isFalse(StatementCache.isOpening("start"));
    Assert.isFalse(StatementCache.isOpening("start;"));
    Assert.isFalse(StatementCache.isOpening("restart transaction"));
    Assert.isFalse(StatementCache.isOpening("start transactions"));
    Assert.isFalse(StatementCache.isOpening("select 1"));
  }
}
