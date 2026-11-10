/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ChangeOperation } from "@noldova/context.data";
import { SqlMigrator, SqlProvider } from "@noldova/context.data.sql";
import { PostgreSQLConnection, PostgreSQLProvider } from "@noldova/context.data.sql.postgresql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TemporarySchema } from "../fixtures/temporary-schema.fixture.js";

@TestClass
export class PostgreSQLProviderTests {
  @TestMethod
  public async opensPostgreSQLConnectionsAndCreatesSqlMigrators(): Promise<void> {
    await using schema = await TemporarySchema.createAsync();
    const provider = new PostgreSQLProvider();
    const dataSource = schema.dataSource();

    await using connection = provider.openConnection(dataSource);

    Assert.isInstanceOf(provider, SqlProvider);
    Assert.isInstanceOf(connection, PostgreSQLConnection);
    Assert.areEqual(dataSource, connection.dataSource);
    Assert.isTrue(connection.isOpen);
    Assert.isInstanceOf(provider.createMigrator(connection, []), SqlMigrator);
  }

  @TestMethod
  public async ordersAppendsFromTwoConnectionsByTheirCommits(): Promise<void> {
    await using schema = await TemporarySchema.createAsync();
    const provider = new PostgreSQLProvider();
    await using first = provider.openConnection(schema.dataSource());
    await using second = provider.openConnection(schema.dataSource());
    const feeds = [provider.createChangeFeed(first), provider.createChangeFeed(second)];
    await feeds[0]?.readAfterAsync(0);

    const changes = await Promise.all([0, 1, 2, 3, 4, 5].map(async t => feeds[t % 2]?.appendAsync("note", String(t), ChangeOperation.Insert, "{}")));
    const read = await feeds[1]?.readAfterAsync(0);

    Assert.areEqual("1,2,3,4,5,6", changes.map(t => t?.sequence).sort().join(","));
    Assert.areEqual("1,2,3,4,5,6", read?.map(t => t.sequence).join(","));
  }
}
