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
     * Returns options that open the PostgreSQL database at the location, a
     * connection string of the form `postgres://user:password@host:port/database`,
     * through `PostgreSQLProvider`; the data source is named after the
     * database. A blank location throws `ArgumentException`, and one that is
     * not such a connection string throws `DataException`, whose message never
     * holds the location.
     */
    usePostgreSQL(location: string): DbContextOptions<SqlConnection, SqlMigration>;
  }
}

/**
 * How PostgreSQL spells transactions, column types, generated keys, and locks.
 */
export declare class PostgreSQLDialect extends SqlDialect {
  /**
   * `BEGIN`: PostgreSQL's row locks and the advisory lock from `formatLock`
   * serialize the writers, so a transaction needs no write lock when it
   * begins.
   */
  public override formatBeginTransaction(): string;

  /**
   * `TEXT` or `BIGINT`.
   */
  public override formatColumnType(type: ColumnType): string;

  /**
   * `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`, so the database
   * generates every key and refuses one given by the insert.
   */
  public override formatIdentityColumnType(): string;

  /**
   * One statement taking the transaction-scoped advisory lock keyed by the
   * hash of the resource's name, held until the transaction ends.
   */
  public override formatLock(resource: string): readonly string[];
}

/**
 * A connection to a PostgreSQL database, holding one server session of its
 * own from its first operation until it is closed, so a transaction's
 * statements run in one session. The data source's location is the
 * connection string. Statements mark their parameters with `?`, as for every
 * SQL provider; numbers, text, and `NULL` go to the server as text. A row
 * reads `BIGINT` and the smaller integer and floating-point types as numbers,
 * a `BIGINT` outside the safe integers rejecting with `DataException`, and
 * every other type as its text. An insert returns the value the session's
 * sequences last gave, so it needs a table whose key is generated.
 */
export declare class PostgreSQLConnection extends SqlConnection {
  /**
   * Opens a connection on the data source without reaching the server, which
   * the first operation does. A location that is not a connection string
   * throws `DataException`, whose message never holds the location.
   */
  public static open(dataSource: DataSource): PostgreSQLConnection;

  /**
   * The PostgreSQL dialect.
   */
  public override get dialect(): SqlDialect;

  private constructor(dataSource: DataSource, session: unknown);
}

/**
 * The PostgreSQL provider: opens `PostgreSQLConnection` on a data source's
 * connection string and inherits the `SqlMigrator`, whose advisory lock lets
 * several processes migrate one database at once. Reached through
 * `DbContextOptionsBuilder.usePostgreSQL`.
 */
export declare class PostgreSQLProvider extends SqlProvider {
  /**
   * Opens a connection on the data source.
   */
  public override openConnection(dataSource: DataSource): PostgreSQLConnection;
}
