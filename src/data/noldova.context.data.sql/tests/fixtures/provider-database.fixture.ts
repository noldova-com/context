/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { env } from "node:process";

import "@noldova/context.core";
import { DataSource, DbContextOptionsBuilder, type DbContextOptions } from "@noldova/context.data";
import { SqlQuery, type SqlConnection, type SqlMigration } from "@noldova/context.data.sql";
import { PostgreSQLConnection } from "@noldova/context.data.sql.postgresql";
import "@noldova/context.data.sql.sqlite";

import { Released } from "./released.fixture.js";
import { SchemaQueries } from "./schema-queries.fixture.js";

export class ProviderDatabase implements AsyncDisposable {
  public static readonly sqlite: string = "sqlite";
  public static readonly postgresql: string = "postgresql";

  private static readonly serverVariable: string = "NOLDOVA_CONTEXT_POSTGRESQL_URL";
  private static readonly sqliteSchema: SchemaQueries = new SchemaQueries(
    "SELECT \"name\", \"type\", \"notnull\" AS \"notNull\" FROM pragma_table_info(?) ORDER BY \"name\"",
    "SELECT \"name\" FROM pragma_table_info(?) WHERE \"pk\" > 0 ORDER BY \"pk\"",
    "SELECT \"from\", \"table\", \"to\" FROM pragma_foreign_key_list(?) ORDER BY \"from\"");
  private static readonly postgresqlSchema: SchemaQueries = new SchemaQueries(
    "SELECT column_name::text AS \"name\", upper(data_type::text) AS \"type\", CASE WHEN is_nullable::text = 'NO' THEN 1 ELSE 0 END AS \"notNull\" "
      + "FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ? ORDER BY column_name COLLATE \"C\"",
    "SELECT k.column_name::text AS \"name\" FROM information_schema.table_constraints c JOIN information_schema.key_column_usage k "
      + "ON k.constraint_schema = c.constraint_schema AND k.constraint_name = c.constraint_name "
      + "WHERE c.table_schema = current_schema() AND c.table_name = ? AND c.constraint_type = 'PRIMARY KEY' ORDER BY k.ordinal_position",
    "SELECT k.column_name::text AS \"from\", u.table_name::text AS \"table\", u.column_name::text AS \"to\" "
      + "FROM information_schema.table_constraints c JOIN information_schema.key_column_usage k "
      + "ON k.constraint_schema = c.constraint_schema AND k.constraint_name = c.constraint_name "
      + "JOIN information_schema.constraint_column_usage u ON u.constraint_schema = c.constraint_schema AND u.constraint_name = c.constraint_name "
      + "WHERE c.table_schema = current_schema() AND c.table_name = ? AND c.constraint_type = 'FOREIGN KEY' ORDER BY k.column_name COLLATE \"C\"");

  private readonly provider: string;
  private readonly location: string;
  private readonly drop: () => Promise<void>;
  private readonly indexes: (name: string) => SqlQuery;

  private constructor(provider: string, location: string, drop: () => Promise<void>, indexes: (name: string) => SqlQuery) {
    this.provider = provider;
    this.location = location;
    this.drop = drop;
    this.indexes = indexes;
  }

  public static async createAsync(provider: string): Promise<ProviderDatabase> {
    if (provider === ProviderDatabase.sqlite) {
      const folder = mkdtempSync(join(tmpdir(), "context-data-sql-"));
      return new ProviderDatabase(provider, join(folder, "notes.db"), () => {
        rmSync(folder, { recursive: true, force: true });
        return Promise.resolve();
      }, name => new SqlQuery("SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?", [name]));
    }
    if (provider !== ProviderDatabase.postgresql)
      throw new Error(`No database for the provider ${provider}.`);

    const schema = `context_${randomUUID().replaceAll("-", "")}`;
    await ProviderDatabase.runAsync(`CREATE SCHEMA "${schema}"`);
    const location = ProviderDatabase.serverLocation();
    location.searchParams.set("search_path", schema);
    return new ProviderDatabase(provider, location.href, async () => {
      await ProviderDatabase.runAsync(`DROP SCHEMA "${schema}" CASCADE`);
      if (!await Released.socketsAsync())
        throw new Error("The test's connections left their sockets open.");
    }, name => new SqlQuery("SELECT indexname FROM pg_indexes WHERE schemaname = ? AND indexname = ?", [schema, name]));
  }

  public options(): DbContextOptions<SqlConnection, SqlMigration> {
    return this.provider === ProviderDatabase.sqlite
      ? new DbContextOptionsBuilder().useSQLite(this.location)
      : new DbContextOptionsBuilder().usePostgreSQL(this.location);
  }

  public findIndex(name: string): SqlQuery {
    return this.indexes(name);
  }

  public async describeAsync(connection: SqlConnection, table: string): Promise<string> {
    const schema = this.provider === ProviderDatabase.sqlite ? ProviderDatabase.sqliteSchema : ProviderDatabase.postgresqlSchema;
    const columns = await connection.queryAsync(new SqlQuery(schema.columns, [table]));
    const key = await connection.queryAsync(new SqlQuery(schema.key, [table]));
    const foreignKeys = await connection.queryAsync(new SqlQuery(schema.foreignKeys, [table]));
    const describedColumns = columns.map(t => `${t.readString("name")} ${t.readString("type")}${t.readInteger("notNull") === 1 ? " NOT NULL" : ""}`);
    const describedKey = key.map(t => t.readString("name"));
    const describedForeignKeys = foreignKeys.map(t => `${t.readString("from")}>${t.readString("table")}.${t.readString("to")}`);

    return `${describedColumns.join(", ")}; key ${describedKey.join(", ")}; references ${describedForeignKeys.join(", ")}`;
  }

  public [Symbol.asyncDispose](): Promise<void> {
    return this.drop();
  }

  private static serverLocation(): URL {
    const text = env[ProviderDatabase.serverVariable];
    if (Object.isUndefined(text) || text.length === 0)
      throw new Error(`${ProviderDatabase.serverVariable} names no PostgreSQL server; run the tests with npm run test.`);

    return new URL(text);
  }

  private static async runAsync(text: string): Promise<void> {
    await using connection = PostgreSQLConnection.open(new DataSource("admin", ProviderDatabase.serverLocation().href));
    await connection.executeAsync(new SqlQuery(text));
  }
}
