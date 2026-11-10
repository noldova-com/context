/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { basename, extname } from "node:path";

import { DataSource, type DbContextOptions, DbContextOptionsBuilder } from "@noldova/context.data";
import type { SqlConnection, SqlMigration } from "@noldova/context.data.sql";
import { ArgumentException } from "@noldova/context.exceptions";

import { Resources } from "../resources.js";
import { SQLiteProvider } from "../services/sqlite-provider.js";

declare module "@noldova/context.data" {
  interface DbContextOptionsBuilder {
    useSQLite(location: string): DbContextOptions<SqlConnection, SqlMigration>;
  }
}

DbContextOptionsBuilder.prototype.useSQLite = function (this: DbContextOptionsBuilder, location: string): DbContextOptions<SqlConnection, SqlMigration> {
  ArgumentException.throwIfNullOrWhitespace(location, Resources.locationParameterName);

  return this.use(new SQLiteProvider(), new DataSource(basename(location, extname(location)), location));
};
