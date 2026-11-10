/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { once } from "node:events";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Worker } from "node:worker_threads";

import { DataException, DataSource } from "@noldova/context.data";
import { SqlQuery } from "@noldova/context.data.sql";
import { SQLiteConnection, SQLiteDialect } from "@noldova/context.data.sql.sqlite";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TemporaryDirectory } from "../fixtures/temporary-directory.fixture.js";

@TestClass
export class SQLiteConnectionTests {
  private static readonly createNotes: SqlQuery = new SqlQuery("CREATE TABLE notes (id TEXT PRIMARY KEY, text TEXT NOT NULL, count INTEGER)");
  private static readonly selectNotes: SqlQuery = new SqlQuery("SELECT id, text, count FROM notes ORDER BY id");
  private static readonly writer: string = [
    "const { parentPort, workerData } = require(\"node:worker_threads\");",
    "const { DatabaseSync } = require(\"node:sqlite\");",
    "const database = new DatabaseSync(workerData);",
    "database.exec(\"BEGIN IMMEDIATE\");",
    "database.exec(\"INSERT INTO notes (id, text) VALUES ('a', 'other')\");",
    "database.exec(\"COMMIT\");",
    "database.close();",
    "parentPort.postMessage(\"committed\");"
  ].join("\n");

  @TestMethod
  public async opensTheFileCreatingItsDirectoryWhenAbsent(): Promise<void> {
    using directory = new TemporaryDirectory();
    const dataSource = new DataSource("app", join(directory.path, "nested", "app.db"));
    await using connection = SQLiteConnection.open(dataSource);

    Assert.areEqual(dataSource, connection.dataSource);
    Assert.isTrue(existsSync(dataSource.location));
    Assert.isTrue(connection.isOpen);
    Assert.isInstanceOf(connection.dialect, SQLiteDialect);
  }

  @TestMethod
  public async opensWithWriteAheadLoggingAndABusyTimeout(): Promise<void> {
    using directory = new TemporaryDirectory();
    await using connection = SQLiteConnection.open(directory.dataSource("app"));

    Assert.areEqual("wal", (await connection.queryAsync(new SqlQuery("PRAGMA journal_mode")))[0]?.readString("journal_mode"));
    Assert.areEqual(5000, (await connection.queryAsync(new SqlQuery("PRAGMA busy_timeout")))[0]?.readInteger("timeout"));
  }

  @TestMethod
  public opensNoHandleOnAFileThatIsNotADatabase(): void {
    using directory = new TemporaryDirectory();
    const dataSource = directory.dataSource("text");
    writeFileSync(dataSource.location, "This is not a SQLite database, only some text in a file.".repeat(20));

    Assert.throws(() => SQLiteConnection.open(dataSource), Error);
    rmSync(dataSource.location);
    Assert.isFalse(existsSync(dataSource.location));
  }

  @TestMethod
  public async executesInsertsAndQueriesRecords(): Promise<void> {
    using directory = new TemporaryDirectory();
    await using connection = SQLiteConnection.open(directory.dataSource("app"));
    await connection.executeAsync(SQLiteConnectionTests.createNotes);

    Assert.areEqual(1, await connection.executeAsync(new SqlQuery("INSERT INTO notes (id, text, count) VALUES (?, ?, ?)", ["a", "first", 1])));
    Assert.areEqual(2, await connection.insertAsync(new SqlQuery("INSERT INTO notes (id, text, count) VALUES (?, ?, ?)", ["b", "second", null])));
    const records = await connection.queryAsync(SQLiteConnectionTests.selectNotes);
    Assert.areEqual(2, records.length);
    Assert.areEqual("first", records[0]?.readString("text"));
    Assert.areEqual(1, records[0]?.readInteger("count"));
    Assert.isNull(records[1]?.readNullableInteger("count"));
    Assert.areEqual(1, (await connection.queryAsync(new SqlQuery("SELECT id FROM notes WHERE text = ?", ["second"]))).length);
  }

  @TestMethod
  public async rollsBackATransactionThatThrows(): Promise<void> {
    using directory = new TemporaryDirectory();
    await using connection = SQLiteConnection.open(directory.dataSource("app"));
    await connection.executeAsync(SQLiteConnectionTests.createNotes);

    await Assert.throwsAsync(async () => connection.runInTransactionAsync(async t => {
      await t.executeAsync(new SqlQuery("INSERT INTO notes (id, text) VALUES ('a', 'first')"));
      throw new Error("stop");
    }), Error);

    Assert.areEqual(0, (await connection.queryAsync(SQLiteConnectionTests.selectNotes)).length);
  }

  @TestMethod
  public async enforcesForeignKeys(): Promise<void> {
    using directory = new TemporaryDirectory();
    await using connection = SQLiteConnection.open(directory.dataSource("app"));
    await connection.executeAsync(new SqlQuery("CREATE TABLE owners (id TEXT PRIMARY KEY)"));
    await connection.executeAsync(new SqlQuery("CREATE TABLE pets (id TEXT PRIMARY KEY, ownerId TEXT NOT NULL REFERENCES owners(id))"));

    await Assert.throwsAsync(async () => connection.executeAsync(new SqlQuery("INSERT INTO pets (id, ownerId) VALUES ('p', 'missing')")), Error);
  }

  @TestMethod
  public async rejectsRowsHoldingUnsupportedValues(): Promise<void> {
    using directory = new TemporaryDirectory();
    await using connection = SQLiteConnection.open(directory.dataSource("app"));

    await Assert.throwsAsync(async () => connection.queryAsync(new SqlQuery("SELECT x'00' AS blob")), DataException);
  }

  @TestMethod
  public async refusesWorkOnceClosedAndClosesOnlyOnce(): Promise<void> {
    using directory = new TemporaryDirectory();
    const connection = SQLiteConnection.open(directory.dataSource("app"));
    await connection.closeAsync();
    await connection.closeAsync();

    Assert.isFalse(connection.isOpen);
    await Assert.throwsAsync(async () => connection.executeAsync(SQLiteConnectionTests.createNotes), DataException);
    await Assert.throwsAsync(async () => connection.insertAsync(SQLiteConnectionTests.createNotes), DataException);
    await Assert.throwsAsync(async () => connection.queryAsync(SQLiteConnectionTests.selectNotes), DataException);
    await Assert.throwsAsync(async () => connection.runInTransactionAsync(async () => 1), DataException);
  }

  @TestMethod
  public async commitsNestedTransactionsAsOne(): Promise<void> {
    using directory = new TemporaryDirectory();
    await using connection = SQLiteConnection.open(directory.dataSource("app"));
    await connection.executeAsync(SQLiteConnectionTests.createNotes);

    await connection.runInTransactionAsync(async t => {
      await t.executeAsync(new SqlQuery("INSERT INTO notes (id, text) VALUES ('a', 'first')"));
      await t.runInTransactionAsync(async nested => nested.executeAsync(new SqlQuery("INSERT INTO notes (id, text) VALUES ('b', 'second')")));
    });

    Assert.areEqual(2, (await connection.queryAsync(SQLiteConnectionTests.selectNotes)).length);
  }

  @TestMethod
  public async runsConcurrentTransactionsOneAfterAnother(): Promise<void> {
    using directory = new TemporaryDirectory();
    await using connection = SQLiteConnection.open(directory.dataSource("app"));
    await connection.executeAsync(SQLiteConnectionTests.createNotes);

    const results = await Promise.allSettled([
      connection.runInTransactionAsync(async t => {
        await t.executeAsync(new SqlQuery("INSERT INTO notes (id, text) VALUES ('a', 'first')"));
        throw new Error("stop");
      }),
      connection.runInTransactionAsync(async t => t.executeAsync(new SqlQuery("INSERT INTO notes (id, text) VALUES ('b', 'second')")))
    ]);

    Assert.areEqual("rejected,fulfilled", results.map(t => t.status).join(","));
    Assert.areEqual("b", (await connection.queryAsync(SQLiteConnectionTests.selectNotes)).map(t => t.readString("id")).join(","));
  }

  @TestMethod
  public async readsAnotherConnectionsCommit(): Promise<void> {
    using directory = new TemporaryDirectory();
    const dataSource = directory.dataSource("app");
    await using connection = SQLiteConnection.open(dataSource);
    await connection.executeAsync(SQLiteConnectionTests.createNotes);
    const writer = new Worker(SQLiteConnectionTests.writer, { eval: true, workerData: dataSource.location });
    const exited = once(writer, "exit");
    await once(writer, "message");

    const seen = await connection.runInTransactionAsync(async t => {
      const rows = await t.queryAsync(SQLiteConnectionTests.selectNotes);
      await t.executeAsync(new SqlQuery("INSERT INTO notes (id, text) VALUES (?, ?)", ["b", String(rows.length)]));
      return rows.length;
    });
    await exited;

    Assert.areEqual(1, seen);
    Assert.areEqual("a,b", (await connection.queryAsync(SQLiteConnectionTests.selectNotes)).map(t => t.readString("id")).join(","));
  }

  @TestMethod
  public async rollsBackAFailedCommitAndAllowsTheNextTransaction(): Promise<void> {
    using directory = new TemporaryDirectory();
    await using connection = SQLiteConnection.open(directory.dataSource("commit-failure"));
    await connection.executeAsync(new SqlQuery("CREATE TABLE owners (id INTEGER PRIMARY KEY)"));
    await connection.executeAsync(new SqlQuery("CREATE TABLE pets (ownerId INTEGER REFERENCES owners(id) DEFERRABLE INITIALLY DEFERRED)"));

    const failure = await Assert.throwsAsync(async () => connection.runInTransactionAsync(async t => {
      await t.executeAsync(new SqlQuery("INSERT INTO pets (ownerId) VALUES (?)", [1]));
    }), Error);

    Assert.areEqual("FOREIGN KEY constraint failed", failure.message);
    Assert.isFalse(connection.isInTransaction);
    Assert.areEqual(0, (await connection.queryAsync(new SqlQuery("SELECT ownerId FROM pets"))).length);

    await connection.runInTransactionAsync(async t => {
      await t.executeAsync(new SqlQuery("INSERT INTO owners (id) VALUES (?)", [1]));
      await t.executeAsync(new SqlQuery("INSERT INTO pets (ownerId) VALUES (?)", [1]));
    });

    Assert.areEqual(1, (await connection.queryAsync(new SqlQuery("SELECT ownerId FROM pets"))).length);
  }
}
