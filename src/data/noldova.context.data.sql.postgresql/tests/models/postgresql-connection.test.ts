/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DataException, DataSource } from "@noldova/context.data";
import { SqlQuery } from "@noldova/context.data.sql";
import { PostgreSQLConnection, PostgreSQLDialect } from "@noldova/context.data.sql.postgresql";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { Released } from "../fixtures/released.fixture.js";
import { TemporarySchema } from "../fixtures/temporary-schema.fixture.js";

@TestClass
export class PostgreSQLConnectionTests {
  private static readonly unreachable: string = "postgres://user@127.0.0.1:1/app?connect_timeout=1";
  private static readonly createNotes: SqlQuery = new SqlQuery("CREATE TABLE notes (id TEXT PRIMARY KEY, text TEXT NOT NULL, count BIGINT)");
  private static readonly createCounters: SqlQuery = new SqlQuery("CREATE TABLE counters (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name TEXT NOT NULL)");
  private static readonly selectNotes: SqlQuery = new SqlQuery("SELECT id, text, count FROM notes ORDER BY id");

  @TestMethod
  public async opensWithoutReachingTheServer(): Promise<void> {
    const dataSource = new DataSource("app", PostgreSQLConnectionTests.unreachable);
    const connection = PostgreSQLConnection.open(dataSource);

    Assert.areEqual(dataSource, connection.dataSource);
    Assert.isTrue(connection.isOpen);
    Assert.isInstanceOf(connection.dialect, PostgreSQLDialect);
    await connection.closeAsync();
    Assert.isFalse(connection.isOpen);
  }

  @TestMethod
  public rejectsALocationThatIsNotAConnectionStringWithoutNamingIt(): void {
    const failure = Assert.throws(() => PostgreSQLConnection.open(new DataSource("app", "/data/secret-app.db")), DataException);

    Assert.isFalse(failure.message.includes("secret-app"));
  }

  @TestMethod
  public async rejectsAnUnreachableServerAndTriesAgainOnTheNextOperation(): Promise<void> {
    const connection = PostgreSQLConnection.open(new DataSource("app", PostgreSQLConnectionTests.unreachable));

    await Assert.throwsAsync(async () => connection.queryAsync(new SqlQuery("SELECT 1 AS one")), Error);
    await Assert.throwsAsync(async () => connection.queryAsync(new SqlQuery("SELECT 1 AS one")), Error);
    Assert.isTrue(connection.isOpen);
    await connection.closeAsync();
    Assert.isTrue(await Released.socketsAsync());
  }

  @TestMethod
  public async executesInsertsAndQueriesRecords(): Promise<void> {
    await using schema = await TemporarySchema.createAsync();
    await using connection = PostgreSQLConnection.open(schema.dataSource());
    await connection.executeAsync(PostgreSQLConnectionTests.createNotes);
    await connection.executeAsync(PostgreSQLConnectionTests.createCounters);

    Assert.areEqual(1, await connection.executeAsync(new SqlQuery("INSERT INTO notes (id, text, count) VALUES (?, ?, ?)", ["a", "first", 1])));
    Assert.areEqual(1, await connection.executeAsync(new SqlQuery("INSERT INTO notes (id, text, count) VALUES (?, ?, ?)", ["b", "second", null])));
    Assert.areEqual(1, await connection.insertAsync(new SqlQuery("INSERT INTO counters (name) VALUES (?)", ["one"])));
    Assert.areEqual(2, await connection.insertAsync(new SqlQuery("INSERT INTO counters (name) VALUES (?)", ["two"])));
    const records = await connection.queryAsync(PostgreSQLConnectionTests.selectNotes);
    Assert.areEqual(2, records.length);
    Assert.areEqual("first", records[0]?.readString("text"));
    Assert.areEqual(1, records[0]?.readInteger("count"));
    Assert.isNull(records[1]?.readNullableInteger("count"));
    Assert.areEqual(1, (await connection.queryAsync(new SqlQuery("SELECT id FROM notes WHERE text = ?", ["second"]))).length);
    Assert.areEqual(0, (await connection.queryAsync(new SqlQuery("UPDATE notes SET count = ? WHERE id = ?", [2, "missing"]))).length);
    Assert.areEqual(2, await connection.executeAsync(new SqlQuery("UPDATE notes SET count = ?", [3])));
  }

  @TestMethod
  public async rejectsAnInsertIntoATableWithoutAGeneratedKeyBeforeAnySequenceWasUsed(): Promise<void> {
    await using schema = await TemporarySchema.createAsync();
    await using connection = PostgreSQLConnection.open(schema.dataSource());
    await connection.executeAsync(PostgreSQLConnectionTests.createNotes);

    await Assert.throwsAsync(async () => connection.insertAsync(new SqlQuery("INSERT INTO notes (id, text) VALUES (?, ?)", ["a", "first"])), DataException);
    Assert.areEqual(1, (await connection.queryAsync(PostgreSQLConnectionTests.selectNotes)).length);
  }

  @TestMethod
  public async readsNoRecordsFromAStatementWithoutRows(): Promise<void> {
    await using schema = await TemporarySchema.createAsync();
    await using connection = PostgreSQLConnection.open(schema.dataSource());
    await connection.executeAsync(PostgreSQLConnectionTests.createNotes);

    const records = await connection.queryAsync(new SqlQuery("INSERT INTO notes (id, text) VALUES (?, ?)", ["a", "first"]));

    Assert.areEqual(0, records.length);
    Assert.areEqual(1, (await connection.queryAsync(PostgreSQLConnectionTests.selectNotes)).length);
  }

  @TestMethod
  public async refusesAStatementThatGivesNoSingleResult(): Promise<void> {
    await using schema = await TemporarySchema.createAsync();
    await using connection = PostgreSQLConnection.open(schema.dataSource());

    const error = await Assert.throwsAsync(async () => connection.queryAsync(new SqlQuery("COPY (SELECT 1) TO STDOUT")), DataException);

    Assert.areEqual("The statement gave no single result, as a COPY does; the connection runs only statements that give one.", error.message);
  }

  @TestMethod
  public async readsNumbersAsNumbersAndOtherTypesAsText(): Promise<void> {
    await using schema = await TemporarySchema.createAsync();
    await using connection = PostgreSQLConnection.open(schema.dataSource());

    const [record] = await connection.queryAsync(new SqlQuery("SELECT 1::int AS small, 2::bigint AS big, 1.5::float8 AS real, 12.50::numeric AS exact, true AS flag, 'x' AS text"));

    Assert.areEqual(1, record?.readValue("small"));
    Assert.areEqual(2, record?.readValue("big"));
    Assert.areEqual(1.5, record?.readValue("real"));
    Assert.areEqual("12.50", record?.readValue("exact"));
    Assert.areEqual("t", record?.readValue("flag"));
    Assert.areEqual("x", record?.readValue("text"));
    await Assert.throwsAsync(async () => connection.queryAsync(new SqlQuery("SELECT 9007199254740993::bigint AS big")), DataException);
  }

  @TestMethod
  public async keepsQuestionMarksInsideTextAndRejectsSeveralStatements(): Promise<void> {
    await using schema = await TemporarySchema.createAsync();
    await using connection = PostgreSQLConnection.open(schema.dataSource());

    const [record] = await connection.queryAsync(new SqlQuery("SELECT '?' AS mark, ?::text AS value", ["given"]));

    Assert.areEqual("?", record?.readString("mark"));
    Assert.areEqual("given", record?.readString("value"));
    await Assert.throwsAsync(async () => connection.executeAsync(new SqlQuery("SELECT 1; SELECT 2")), Error);
  }

  @TestMethod
  public async rollsBackATransactionThatThrows(): Promise<void> {
    await using schema = await TemporarySchema.createAsync();
    await using connection = PostgreSQLConnection.open(schema.dataSource());
    await connection.executeAsync(PostgreSQLConnectionTests.createNotes);

    await Assert.throwsAsync(async () => connection.runInTransactionAsync(async t => {
      await t.executeAsync(new SqlQuery("INSERT INTO notes (id, text) VALUES ('a', 'first')"));
      throw new Error("stop");
    }), Error);

    Assert.areEqual(0, (await connection.queryAsync(PostgreSQLConnectionTests.selectNotes)).length);
  }

  @TestMethod
  public async enforcesForeignKeys(): Promise<void> {
    await using schema = await TemporarySchema.createAsync();
    await using connection = PostgreSQLConnection.open(schema.dataSource());
    await connection.executeAsync(new SqlQuery("CREATE TABLE owners (id TEXT PRIMARY KEY)"));
    await connection.executeAsync(new SqlQuery("CREATE TABLE pets (id TEXT PRIMARY KEY, ownerId TEXT NOT NULL REFERENCES owners(id))"));

    await Assert.throwsAsync(async () => connection.executeAsync(new SqlQuery("INSERT INTO pets (id, ownerId) VALUES ('p', 'missing')")), Error);
  }

  @TestMethod
  public async refusesWorkOnceClosedAndClosesOnlyOnce(): Promise<void> {
    await using schema = await TemporarySchema.createAsync();
    const connection = PostgreSQLConnection.open(schema.dataSource());
    await connection.executeAsync(PostgreSQLConnectionTests.createNotes);
    await connection.closeAsync();
    await connection.closeAsync();

    Assert.isFalse(connection.isOpen);
    await Assert.throwsAsync(async () => connection.executeAsync(PostgreSQLConnectionTests.createNotes), DataException);
    await Assert.throwsAsync(async () => connection.insertAsync(PostgreSQLConnectionTests.createNotes), DataException);
    await Assert.throwsAsync(async () => connection.queryAsync(PostgreSQLConnectionTests.selectNotes), DataException);
    await Assert.throwsAsync(async () => connection.runInTransactionAsync(async () => 1), DataException);
  }

  @TestMethod
  public async commitsNestedTransactionsAsOne(): Promise<void> {
    await using schema = await TemporarySchema.createAsync();
    await using connection = PostgreSQLConnection.open(schema.dataSource());
    await connection.executeAsync(PostgreSQLConnectionTests.createNotes);

    await connection.runInTransactionAsync(async t => {
      await t.executeAsync(new SqlQuery("INSERT INTO notes (id, text) VALUES ('a', 'first')"));
      await t.runInTransactionAsync(async nested => nested.executeAsync(new SqlQuery("INSERT INTO notes (id, text) VALUES ('b', 'second')")));
    });

    Assert.areEqual(2, (await connection.queryAsync(PostgreSQLConnectionTests.selectNotes)).length);
  }

  @TestMethod
  public async runsConcurrentTransactionsOneAfterAnother(): Promise<void> {
    await using schema = await TemporarySchema.createAsync();
    await using connection = PostgreSQLConnection.open(schema.dataSource());
    await connection.executeAsync(PostgreSQLConnectionTests.createNotes);

    const results = await Promise.allSettled([
      connection.runInTransactionAsync(async t => {
        await t.executeAsync(new SqlQuery("INSERT INTO notes (id, text) VALUES ('a', 'first')"));
        throw new Error("stop");
      }),
      connection.runInTransactionAsync(async t => t.executeAsync(new SqlQuery("INSERT INTO notes (id, text) VALUES ('b', 'second')")))
    ]);

    Assert.areEqual("rejected,fulfilled", results.map(t => t.status).join(","));
    Assert.areEqual("b", (await connection.queryAsync(PostgreSQLConnectionTests.selectNotes)).map(t => t.readString("id")).join(","));
  }

  @TestMethod
  public async keepsAnotherConnectionsWorkApartUntilItCommits(): Promise<void> {
    await using schema = await TemporarySchema.createAsync();
    await using connection = PostgreSQLConnection.open(schema.dataSource());
    await using other = PostgreSQLConnection.open(schema.dataSource());
    await connection.executeAsync(PostgreSQLConnectionTests.createNotes);

    const seen = await other.runInTransactionAsync(async t => {
      await t.executeAsync(new SqlQuery("INSERT INTO notes (id, text) VALUES ('a', 'other')"));
      return (await connection.queryAsync(PostgreSQLConnectionTests.selectNotes)).length;
    });

    Assert.areEqual(0, seen);
    Assert.areEqual("a", (await connection.queryAsync(PostgreSQLConnectionTests.selectNotes)).map(t => t.readString("id")).join(","));
  }

  @TestMethod
  public async rollsBackAFailedCommitAndAllowsTheNextTransaction(): Promise<void> {
    await using schema = await TemporarySchema.createAsync();
    await using connection = PostgreSQLConnection.open(schema.dataSource());
    await connection.executeAsync(new SqlQuery("CREATE TABLE owners (id BIGINT PRIMARY KEY)"));
    await connection.executeAsync(new SqlQuery("CREATE TABLE pets (ownerId BIGINT REFERENCES owners(id) DEFERRABLE INITIALLY DEFERRED)"));

    await Assert.throwsAsync(async () => connection.runInTransactionAsync(async t => {
      await t.executeAsync(new SqlQuery("INSERT INTO pets (ownerId) VALUES (?)", [1]));
    }), Error);

    Assert.isFalse(connection.isInTransaction);
    Assert.areEqual(0, (await connection.queryAsync(new SqlQuery("SELECT ownerId FROM pets"))).length);

    await connection.runInTransactionAsync(async t => {
      await t.executeAsync(new SqlQuery("INSERT INTO owners (id) VALUES (?)", [1]));
      await t.executeAsync(new SqlQuery("INSERT INTO pets (ownerId) VALUES (?)", [1]));
    });

    Assert.areEqual(1, (await connection.queryAsync(new SqlQuery("SELECT ownerId FROM pets"))).length);
  }
}
