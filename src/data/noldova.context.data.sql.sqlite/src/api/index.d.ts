/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DataSource, DbContextOptions, PropertyType } from "@noldova/context.data";
import { type Column, type SchemaOperation, SqlConnection, SqlDialect, type SqlMigration, SqlProvider, type SqlTransaction } from "@noldova/context.data.sql";

declare module "@noldova/context.data" {
  interface DbContextOptionsBuilder {
    /**
     * Returns options that open the SQLite database file at the location
     * through `SQLiteProvider`; the data source is named after the file
     * without its extension. A blank location throws `ArgumentException`.
     */
    useSQLite(location: string): DbContextOptions<SqlConnection, SqlMigration>;
  }
}

/**
 * How SQLite spells transactions, column types, generated keys, and locks.
 */
export declare class SQLiteDialect extends SqlDialect {
  /**
   * `BEGIN IMMEDIATE`, which takes the file's write lock when the
   * transaction begins, so a second writer waits for it there instead of
   * failing at its first write with a stale read.
   */
  public override formatBeginTransaction(): string;

  /**
   * `INTEGER` for `PropertyType.Integer`, otherwise `TEXT`.
   */
  public override formatColumnType(type: PropertyType): string;

  /**
   * `INTEGER PRIMARY KEY AUTOINCREMENT`, so a key is never reused after its
   * row is deleted.
   */
  public override formatIdentityColumnType(): string;

  /**
   * No statements: every transaction takes the file's write lock when it
   * begins, so one transaction at a time runs.
   */
  public override formatLock(): readonly string[];

  /**
   * `PRAGMA foreign_keys = OFF`, run on the connection before a migration's
   * transaction, since SQLite ignores the pragma inside one; a table rebuild
   * drops a table that other tables refer to.
   */
  public override formatMigrationStart(): readonly string[];

  /**
   * `PRAGMA foreign_keys = ON`, run after the migration's transaction ends,
   * whether it committed or rolled back.
   */
  public override formatMigrationEnd(): readonly string[];

  /**
   * A query for the first row whose foreign key refers to no row, with the
   * table holding it in `table` and the table it refers to in `parent`; the
   * migrator runs it before it commits.
   */
  public override formatForeignKeyCheck(): string;

  /**
   * Always throws `InvalidOperationException`: SQLite can't alter a column,
   * so `applyAsync` rebuilds the table instead.
   */
  public override renderAlterColumn(table: string, column: Column): string;

  /**
   * Runs a statement operation as `SqlDialect` does. A change to an existing
   * table rebuilds it: reads the live table, creates the changed one under a
   * temporary name with its keys, copies the rows of the columns both keep,
   * drops the old table, renames the new one and recreates each index whose
   * columns all remain.
   *
   * @param operation The operation.
   * @param transaction The migration's transaction.
   */
  public override applyAsync(operation: SchemaOperation, transaction: SqlTransaction): Promise<void>;
}

/**
 * A connection to a SQLite database file through the host's `node:sqlite`,
 * opened with write-ahead logging, foreign keys on, and a busy timeout of
 * five seconds, within which a transaction waits for another connection's
 * write lock. The wait holds the host's thread, so it serves connections in
 * other threads and processes; when the lock's holder is a connection in the
 * same thread, such as a second context on the file part-way through an
 * async transaction, the holder can't go on while the thread waits, so the
 * transaction fails with `database is locked` after the five seconds. A query
 * runs one statement: text holding a second one, past semicolons, comments
 * and white space, rejects with `DataException` before any runs. The data source's
 * location is the file path. Rows hold text, numbers, and `NULL`; a row
 * holding another value, such as a blob, rejects with `DataException` when
 * read. `node:sqlite` runs each statement synchronously, so a statement holds
 * the host's thread while it runs.
 */
export declare class SQLiteConnection extends SqlConnection {
  /**
   * Opens the data source's file, creating its directory and the file when
   * absent.
   */
  public static open(dataSource: DataSource): SQLiteConnection;

  /**
   * The SQLite dialect.
   */
  public override get dialect(): SqlDialect;

  private constructor(dataSource: DataSource, session: unknown);
}

/**
 * The SQLite provider: opens `SQLiteConnection` on a data source's file and
 * inherits the `SqlMigrator`. Reached through
 * `DbContextOptionsBuilder.useSQLite`.
 */
export declare class SQLiteProvider extends SqlProvider {
  /**
   * Opens the data source's file.
   */
  public override openConnection(dataSource: DataSource): SQLiteConnection;
}
