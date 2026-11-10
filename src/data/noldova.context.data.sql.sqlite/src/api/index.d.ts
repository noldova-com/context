/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DataSource, DbContextOptions } from "@noldova/context.data";
import { ColumnType, SqlConnection, SqlDialect, type SqlMigration, SqlProvider } from "@noldova/context.data.sql";

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
   * `TEXT` or `INTEGER`.
   */
  public override formatColumnType(type: ColumnType): string;

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
}

/**
 * A connection to a SQLite database file through the host's `node:sqlite`,
 * opened with write-ahead logging, foreign keys on, and a busy timeout of
 * five seconds, within which a transaction waits for another connection's
 * write lock. The data source's
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
