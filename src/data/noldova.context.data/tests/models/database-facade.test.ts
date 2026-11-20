/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ChangeFeed, DataException, DatabaseFacade, DataSource, DbContextOptions } from "@noldova/context.data";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { MemoryProvider } from "../fixtures/memory-provider.fixture.js";
import { NotesMigration } from "../fixtures/notes-migration.fixture.js";

@TestClass
export class DatabaseFacadeTests {
  @TestMethod
  public async opensTheConnectionWithItsChangeFeedAndMigrates(): Promise<void> {
    const provider = new MemoryProvider();
    const facade = new DatabaseFacade(new DbContextOptions(provider, new DataSource("notes", ":memory:")), [new NotesMigration()]);

    Assert.areEqual(provider.connections[0], facade.connection);
    Assert.areEqual("notes", facade.connection.dataSource.name);
    Assert.areEqual(provider.changeFeeds[0], facade.changeFeed);
    Assert.isInstanceOf(facade.changeFeed, ChangeFeed);
    Assert.areEqual(1, (await facade.getPendingMigrationsAsync()).length);
    Assert.areEqual("20260908130000_Notes", (await facade.migrateAsync()).join(","));
    Assert.areEqual("20260908130000_Notes", (await facade.getAppliedMigrationsAsync()).join(","));
    Assert.areEqual(0, (await facade.getPendingMigrationsAsync()).length);
  }

  @TestMethod
  public async closesTheConnectionWhenTheProviderCannotCreateTheMigrator(): Promise<void> {
    const provider = new MemoryProvider();
    provider.migratorFailure = new Error("no migrator");

    const error = Assert.throws(() => new DatabaseFacade(new DbContextOptions(provider, new DataSource("notes", ":memory:")), []), Error);
    const connection = provider.connections[0];
    await Assert.throwsAsync(async () => connection?.recordAsync("after"), DataException);

    Assert.areEqual(provider.migratorFailure, error);
    Assert.areEqual(1, connection?.closeCount);
  }

  @TestMethod
  public async closesTheConnectionWhenTheProviderCannotCreateTheChangeFeed(): Promise<void> {
    const provider = new MemoryProvider();
    provider.changeFeedFailure = new Error("no change feed");

    const error = Assert.throws(() => new DatabaseFacade(new DbContextOptions(provider, new DataSource("notes", ":memory:")), []), Error);
    const connection = provider.connections[0];
    await Assert.throwsAsync(async () => connection?.recordAsync("after"), DataException);

    Assert.areEqual(provider.changeFeedFailure, error);
    Assert.areEqual(1, connection?.closeCount);
  }

  @TestMethod
  public async throwsTheFactoryFailureWhenTheConnectionAlsoFailsToClose(): Promise<void> {
    const provider = new MemoryProvider();
    provider.migratorFailure = new Error("no migrator");
    provider.closeFailure = new Error("no close");

    const error = Assert.throws(() => new DatabaseFacade(new DbContextOptions(provider, new DataSource("notes", ":memory:")), []), Error);
    const connection = provider.connections[0];
    await Assert.throwsAsync(async () => connection?.recordAsync("after"), DataException);

    Assert.areEqual(provider.migratorFailure, error);
    Assert.areEqual(1, connection?.closeCount);
  }

  @TestMethod
  public opensNoConnectionForMigrationsOutOfOrder(): void {
    const provider = new MemoryProvider();
    const options = new DbContextOptions(provider, new DataSource("notes", ":memory:"));

    Assert.throws(() => new DatabaseFacade(options, [new NotesMigration("20260908140000_Later"), new NotesMigration()]), DataException);
    Assert.throws(() => new DatabaseFacade(options, [new NotesMigration(), new NotesMigration()]), DataException);
    Assert.areEqual(0, provider.connections.length);
  }
}
