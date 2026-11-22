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
     * not such a connection string, or that sets an option the client does not
     * support, throws `DataException`, whose message never holds the location.
     *
     * @param location The connection string; its `sslmode` is `prefer` when
     * neither it nor `ssl` is given.
     * @returns The options for a `DbContext`; nothing reaches the server until
     * the context's first operation.
     * @throws {ArgumentException} When the location is blank.
     * @throws {DataException} When the location is not a PostgreSQL connection
     * string, or sets an option the client does not support.
     *
     * @example
     * ```ts
     * import { DbContextOptionsBuilder } from "@noldova/context.data";
     * import "@noldova/context.data.sql.postgresql";
     *
     * const options = new DbContextOptionsBuilder().usePostgreSQL("postgres://notes@localhost:5432/notes");
     * new DbContextOptionsBuilder().usePostgreSQL("notes.db"); // throws DataException: not a connection string.
     * ```
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
   *
   * @returns `BEGIN`.
   *
   * @example
   * ```ts
   * import { PostgreSQLDialect } from "@noldova/context.data.sql.postgresql";
   *
   * new PostgreSQLDialect().formatBeginTransaction(); // "BEGIN"
   * ```
   */
  public override formatBeginTransaction(): string;

  /**
   * `TEXT` or `BIGINT`.
   *
   * @param type The column's type class.
   * @returns `BIGINT` for `ColumnType.Integer`, otherwise `TEXT`.
   *
   * @example
   * ```ts
   * import { ColumnType } from "@noldova/context.data.sql";
   * import { PostgreSQLDialect } from "@noldova/context.data.sql.postgresql";
   *
   * new PostgreSQLDialect().formatColumnType(ColumnType.Integer); // "BIGINT"
   * new PostgreSQLDialect().formatColumnType(ColumnType.Text); // "TEXT"
   * ```
   */
  public override formatColumnType(type: ColumnType): string;

  /**
   * `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`, so the database
   * generates every key and refuses one given by the insert.
   *
   * @returns The column type of a generated key.
   *
   * @example
   * ```ts
   * import { PostgreSQLDialect } from "@noldova/context.data.sql.postgresql";
   *
   * new PostgreSQLDialect().formatIdentityColumnType(); // "BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY"
   * ```
   */
  public override formatIdentityColumnType(): string;

  /**
   * One statement taking the transaction-scoped advisory lock keyed by the
   * hash of the resource's name, held until the transaction ends.
   *
   * @param resource The name of what the lock guards; any text, a quote in it
   * doubled.
   * @returns One statement, to run inside the transaction.
   *
   * @example
   * ```ts
   * import { PostgreSQLDialect } from "@noldova/context.data.sql.postgresql";
   *
   * new PostgreSQLDialect().formatLock("notes"); // ["SELECT pg_advisory_xact_lock(hashtext('notes'))"]
   * new PostgreSQLDialect().formatLock("it's"); // ["SELECT pg_advisory_xact_lock(hashtext('it''s'))"]
   * ```
   */
  public override formatLock(resource: string): readonly string[];
}

/**
 * A connection to a PostgreSQL database, holding one server session of its
 * own from its first operation until it is closed, so a transaction's
 * statements run in one session. When the server ends that session, as a
 * restart, a dropped network or `pg_terminate_backend` does, every statement
 * of a transaction open on it rejects until the transaction ends, and the
 * next operation outside a transaction reserves a new session. The data
 * source's location is the connection string. Statements mark their
 * parameters with `?`, as for every SQL provider; numbers, text, and `NULL`
 * go to the server as text. A row reads `BIGINT` and the smaller integer and
 * floating-point types as numbers, a `BIGINT` outside the safe integers
 * rejecting with `DataException`, and every other type as its text. An
 * insert returns the value the session's sequences last gave, so it needs a
 * table whose key is generated.
 */
export declare class PostgreSQLConnection extends SqlConnection {
  /**
   * Opens a connection on the data source without reaching the server, which
   * the first operation does. A location that is not a connection string, or
   * that sets an option the client does not support, throws `DataException`,
   * whose message never holds the location.
   *
   * @param dataSource The data source; its location is the connection string.
   * @returns A connection that reserves its server session on its first
   * operation; the caller closes it.
   * @throws {DataException} When the location is not a PostgreSQL connection
   * string, or sets an option the client does not support.
   *
   * @example
   * ```ts
   * import { DataSource } from "@noldova/context.data";
   * import { SqlQuery } from "@noldova/context.data.sql";
   * import { PostgreSQLConnection } from "@noldova/context.data.sql.postgresql";
   *
   * await using connection = PostgreSQLConnection.open(new DataSource("notes", "postgres://notes@localhost:5432/notes"));
   * const rows = await connection.queryAsync(new SqlQuery("SELECT title FROM notes WHERE id = ?", [1]));
   * PostgreSQLConnection.open(new DataSource("notes", "notes.db")); // throws DataException.
   * ```
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
   * Opens a connection on the data source, as `PostgreSQLConnection.open` does.
   *
   * @param dataSource The data source; its location is the connection string.
   * @returns A connection that reserves its server session on its first
   * operation; the caller closes it.
   * @throws {DataException} When the location is not a PostgreSQL connection
   * string, or sets an option the client does not support.
   *
   * @example
   * ```ts
   * import { DataSource } from "@noldova/context.data";
   * import { PostgreSQLProvider } from "@noldova/context.data.sql.postgresql";
   *
   * await using connection = new PostgreSQLProvider().openConnection(new DataSource("notes", "postgres://notes@localhost:5432/notes"));
   * ```
   */
  public override openConnection(dataSource: DataSource): PostgreSQLConnection;
}
