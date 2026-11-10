/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { DataSource, type DbContextOptions, DbContextOptionsBuilder } from "@noldova/context.data";
import type { SqlConnection, SqlMigration } from "@noldova/context.data.sql";
import { ArgumentException } from "@noldova/context.exceptions";

import { Resources } from "../resources.js";
import { LocationParser } from "../services/location.parser.js";
import { PostgreSQLProvider } from "../services/postgresql-provider.js";

declare module "@noldova/context.data" {
  interface DbContextOptionsBuilder {
    usePostgreSQL(location: string): DbContextOptions<SqlConnection, SqlMigration>;
  }
}

DbContextOptionsBuilder.prototype.usePostgreSQL = function (this: DbContextOptionsBuilder, location: string): DbContextOptions<SqlConnection, SqlMigration> {
  ArgumentException.throwIfNullOrWhitespace(location, Resources.locationParameterName);

  return this.use(new PostgreSQLProvider(), new DataSource(LocationParser.parse(location).connection.database, location));
};
