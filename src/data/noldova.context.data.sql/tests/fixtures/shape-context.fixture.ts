/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DbContext, type DbContextOptions } from "@noldova/context.data";
import type { SqlConnection, SqlMigration } from "@noldova/context.data.sql";

export class ShapeContext extends DbContext<SqlConnection, SqlMigration> {
  public constructor(options: DbContextOptions<SqlConnection, SqlMigration>, migrations: readonly SqlMigration[]) {
    super(options, migrations);
  }
}
