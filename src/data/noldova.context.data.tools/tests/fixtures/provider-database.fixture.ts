/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { env } from "node:process";

import "@noldova/context.core";
import { DataSource, DbContextOptionsBuilder, type DbContextOptions } from "@noldova/context.data";
import { SqlQuery, type SqlConnection, type SqlMigration } from "@noldova/context.data.sql";
import { PostgreSQLConnection } from "@noldova/context.data.sql.postgresql";
import "@noldova/context.data.sql.sqlite";

export class ProviderDatabase implements AsyncDisposable {
  public static readonly sqlite: string = "sqlite";

  private static readonly serverVariable: string = "NOLDOVA_CONTEXT_POSTGRESQL_URL";

  private readonly provider: string;
  private readonly location: string;
  private readonly drop: () => Promise<void>;

  private constructor(provider: string, location: string, drop: () => Promise<void>) {
    this.provider = provider;
    this.location = location;
    this.drop = drop;
  }

  public static async createAsync(provider: string): Promise<ProviderDatabase> {
    if (provider === ProviderDatabase.sqlite) {
      const folder = await mkdtemp(join(tmpdir(), "context-data-tools-"));

      return new ProviderDatabase(provider, join(folder, "notes.db"), () => rm(folder, { recursive: true, force: true }));
    }

    const schema = `context_${randomUUID().replaceAll("-", "")}`;
    await ProviderDatabase.runAsync(`CREATE SCHEMA "${schema}"`);
    const location = ProviderDatabase.serverLocation();
    location.searchParams.set("search_path", schema);

    return new ProviderDatabase(provider, location.href, () => ProviderDatabase.runAsync(`DROP SCHEMA "${schema}" CASCADE`));
  }

  public options(): DbContextOptions<SqlConnection, SqlMigration> {
    return this.provider === ProviderDatabase.sqlite
      ? new DbContextOptionsBuilder().useSQLite(this.location)
      : new DbContextOptionsBuilder().usePostgreSQL(this.location);
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
